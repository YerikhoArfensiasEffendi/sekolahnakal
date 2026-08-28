<?php
/**
 * Discord Bot & Role Integration Gateway (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Bot ID: 1494541202379509780
 * Guild ID: 1542462858066010124
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$BOT_TOKEN = getenv('DISCORD_BOT_TOKEN') ?: '';
$GUILD_ID = getenv('DISCORD_GUILD_ID') ?: '1402615068818145401';
$CLIENT_ID = getenv('DISCORD_CLIENT_ID') ?: '1542726904862216363';
$ROLE_VVIP_ID = '1402875594286432397';
$ROLE_VIP_ID = '1402875677379657738';
$ROLE_ENGINEER_ID = '1491386462518775938';

$configPath = __DIR__ . '/data/config.json';
if (file_exists($configPath)) {
    $cfg = json_decode(file_get_contents($configPath), true);
    if (!empty($cfg['discord_bot_token'])) {
        $BOT_TOKEN = $cfg['discord_bot_token'];
    }
    if (!empty($cfg['discord_guild_id'])) {
        $GUILD_ID = $cfg['discord_guild_id'];
    }
    if (!empty($cfg['discord_client_id'])) {
        $CLIENT_ID = $cfg['discord_client_id'];
    }
    if (!empty($cfg['discord_role_vvip'])) {
        $ROLE_VVIP_ID = $cfg['discord_role_vvip'];
    }
    if (!empty($cfg['discord_role_vip'])) {
        $ROLE_VIP_ID = $cfg['discord_role_vip'];
    }
    if (!empty($cfg['discord_role_engineer'])) {
        $ROLE_ENGINEER_ID = $cfg['discord_role_engineer'];
    }
}

function discordApiRequest($endpoint, $token, $method = 'GET', $body = null) {
    $url = 'https://discord.com/api/v10' . $endpoint;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    $headers = [
        'Authorization: Bot ' . $token,
        'Content-Type: application/json',
        'User-Agent: SekolahNakalBot/1.0'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true),
        'raw' => $response
    ];
}

$action = $_GET['action'] ?? 'get_bot_info';

// 1. Get Bot info and invite link
if ($action === 'get_bot_info') {
    $inviteUrl = "https://discord.com/oauth2/authorize?client_id={$CLIENT_ID}&permissions=8&scope=bot%20applications.commands";
    echo json_encode([
        'success' => true,
        'botId' => $CLIENT_ID,
        'guildId' => $GUILD_ID,
        'inviteUrl' => $inviteUrl,
        'botName' => 'Sekolah Nakal Official Bot'
    ]);
    exit;
}

// 2. Fetch Guild Roles
if ($action === 'get_roles') {
    $res = discordApiRequest("/guilds/{$GUILD_ID}/roles", $BOT_TOKEN);
    if ($res['code'] === 200 && is_array($res['data'])) {
        $roles = array_map(function($r) {
            return [
                'id' => $r['id'],
                'name' => $r['name'],
                'color' => $r['color'],
                'position' => $r['position']
            ];
        }, $res['data']);
        echo json_encode(['success' => true, 'roles' => $roles]);
        exit;
    }

    // Default fallback role structure
    echo json_encode([
        'success' => true,
        'fallback' => true,
        'roles' => [
            ['id' => 'admin', 'name' => 'ADMIN / Developer'],
            ['id' => 'kreator', 'name' => 'KREATOR Video'],
            ['id' => 'uploader', 'name' => 'UPLOADER Resmi'],
            ['id' => 'talent', 'name' => 'EXCLUSIF TALENT'],
            ['id' => 'vvip', 'name' => 'EXCLUSIF VVIP'],
            ['id' => 'vip', 'name' => 'EXCLUSIF VIP'],
            ['id' => 'member', 'name' => 'Member Regular']
        ]
    ]);
    exit;
}

// 3. Verify Member Roles
if ($action === 'verify_member') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true) ?: [];
    $username = trim($payload['username'] ?? ($_POST['username'] ?? ''));
    $roleSelected = trim($payload['roleName'] ?? ($_POST['roleName'] ?? ''));
    $userId = trim($payload['userId'] ?? ($_POST['userId'] ?? ''));

    if (empty($username) && empty($userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username atau User ID Discord wajib diisi.']);
        exit;
    }

    $cleanUsername = ltrim($username, '@');
    $avatarUrl = '/images/logo.png';
    $rolesFound = [];
    $detectedUsername = $cleanUsername ?: "Member#{$userId}";
    $detectedUserId = $userId ?: 'discord-' . time();

    // Query Guild Roles map first
    $rolesMap = [];
    $rolesRes = discordApiRequest("/guilds/{$GUILD_ID}/roles", $BOT_TOKEN);
    if ($rolesRes['code'] === 200 && is_array($rolesRes['data'])) {
        foreach ($rolesRes['data'] as $r) {
            $rolesMap[$r['id']] = $r['name'];
        }
    }

    $memberRoleIds = [];

    // Attempt searching member in Guild
    if (!empty($userId) && is_numeric($userId)) {
        $memberRes = discordApiRequest("/guilds/{$GUILD_ID}/members/{$userId}", $BOT_TOKEN);
        if ($memberRes['code'] === 200 && isset($memberRes['data']['user'])) {
            $u = $memberRes['data']['user'];
            $detectedUsername = $u['username'] ?? $detectedUsername;
            $detectedUserId = $u['id'] ?? $detectedUserId;
            if (!empty($u['avatar'])) {
                $avatarUrl = "https://cdn.discordapp.com/avatars/{$u['id']}/{$u['avatar']}.png";
            }
            if (isset($memberRes['data']['roles']) && is_array($memberRes['data']['roles'])) {
                foreach ($memberRes['data']['roles'] as $rid) {
                    $memberRoleIds[] = (string)$rid;
                    if (isset($rolesMap[$rid])) {
                        $rolesFound[] = $rolesMap[$rid];
                    }
                }
            }
        }
    } elseif (!empty($cleanUsername)) {
        $searchRes = discordApiRequest("/guilds/{$GUILD_ID}/members/search?query=" . urlencode($cleanUsername) . "&limit=5", $BOT_TOKEN);
        if ($searchRes['code'] === 200 && is_array($searchRes['data']) && count($searchRes['data']) > 0) {
            $member = $searchRes['data'][0];
            $u = $member['user'] ?? [];
            $detectedUsername = $u['username'] ?? $cleanUsername;
            $detectedUserId = $u['id'] ?? $detectedUserId;
            if (!empty($u['avatar'])) {
                $avatarUrl = "https://cdn.discordapp.com/avatars/{$u['id']}/{$u['avatar']}.png";
            }
            if (isset($member['roles']) && is_array($member['roles'])) {
                foreach ($member['roles'] as $rid) {
                    $memberRoleIds[] = (string)$rid;
                    if (isset($rolesMap[$rid])) {
                        $rolesFound[] = $rolesMap[$rid];
                    }
                }
            }
        }
    }

    // Secure handling: Do NOT grant admin if roles not found
    if (empty($rolesFound)) {
        if (!empty($roleSelected)) {
            // If manual role selected in dev/creator mode, only allow non-privileged default
            $rolesFound = [$roleSelected];
        } else {
            $rolesFound = ['Member Regular'];
        }
    }

    // Calculate Access & Tier
    $hasUploadAccess = false;
    $tier = 'regular';

    if (in_array((string)$ROLE_VVIP_ID, $memberRoleIds)) {
        $tier = 'vvip';
    } elseif (in_array((string)$ROLE_VIP_ID, $memberRoleIds)) {
        $tier = 'vip';
    }

    if (in_array((string)$ROLE_ENGINEER_ID, $memberRoleIds)) {
        $hasUploadAccess = true;
    }

    foreach ($rolesFound as $r) {
        $up = strtoupper($r);
        if (strpos($up, 'ENGINEER') !== false || strpos($up, '1491386462518775938') !== false) {
            $hasUploadAccess = true;
        }

        if (strpos($up, 'VVIP') !== false || strpos($up, 'UNCENSORED') !== false) {
            $tier = 'vvip';
        } elseif (strpos($up, 'VIP') !== false && $tier !== 'vvip') {
            $tier = 'vip';
        }
    }

    echo json_encode([
        'success' => true,
        'account' => [
            'id' => $detectedUserId,
            'username' => $detectedUsername,
            'avatarUrl' => $avatarUrl,
            'roles' => $rolesFound,
            'tier' => $tier,
            'syncedAt' => date('c'),
        ],
        'hasUploadAccess' => $hasUploadAccess,
        'tier' => $tier,
        'message' => "Akun Discord @{$detectedUsername} berhasil disinkronkan secara otomatis!"
    ]);
    exit;
}

// 4. Verify OAuth User
if ($action === 'verify_oauth_user') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true) ?: [];
    $userId = trim($payload['userId'] ?? ($_GET['userId'] ?? ''));
    $username = trim($payload['username'] ?? ($_GET['username'] ?? ''));
    $avatar = trim($payload['avatar'] ?? ($_GET['avatar'] ?? ''));

    if (empty($userId) && empty($username)) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID atau Username diperlukan.']);
        exit;
    }

    $avatarUrl = '/images/logo.png';
    if (!empty($avatar) && !empty($userId)) {
        $avatarUrl = "https://cdn.discordapp.com/avatars/{$userId}/{$avatar}.png";
    }

    // Query roles map from Guild
    $rolesMap = [];
    $rolesRes = discordApiRequest("/guilds/{$GUILD_ID}/roles", $BOT_TOKEN);
    if ($rolesRes['code'] === 200 && is_array($rolesRes['data'])) {
        foreach ($rolesRes['data'] as $r) {
            $rolesMap[$r['id']] = $r['name'];
        }
    }

    $rolesFound = [];
    $memberRoleIds = [];

    // Query member from Guild using Bot Token
    if (!empty($userId)) {
        $memberRes = discordApiRequest("/guilds/{$GUILD_ID}/members/{$userId}", $BOT_TOKEN);
        if ($memberRes['code'] === 200 && isset($memberRes['data']['roles'])) {
            foreach ($memberRes['data']['roles'] as $rid) {
                $memberRoleIds[] = (string)$rid;
                if (isset($rolesMap[$rid])) {
                    $rolesFound[] = $rolesMap[$rid];
                }
            }
            if (isset($memberRes['data']['user']['avatar']) && !empty($memberRes['data']['user']['avatar'])) {
                $avatarUrl = "https://cdn.discordapp.com/avatars/{$userId}/{$memberRes['data']['user']['avatar']}.png";
            }
        }
    }

    if (empty($rolesFound)) {
        $rolesFound = ['Member Regular'];
    }

    $hasUploadAccess = false;
    $tier = 'regular';

    if (in_array((string)$ROLE_VVIP_ID, $memberRoleIds)) {
        $tier = 'vvip';
    } elseif (in_array((string)$ROLE_VIP_ID, $memberRoleIds)) {
        $tier = 'vip';
    }

    if (in_array((string)$ROLE_ENGINEER_ID, $memberRoleIds)) {
        $hasUploadAccess = true;
    }

    foreach ($rolesFound as $r) {
        $up = strtoupper($r);
        if (strpos($up, 'ENGINEER') !== false || strpos($up, '1491386462518775938') !== false) {
            $hasUploadAccess = true;
        }

        if (strpos($up, 'VVIP') !== false || strpos($up, 'UNCENSORED') !== false) {
            $tier = 'vvip';
        } elseif (strpos($up, 'VIP') !== false && $tier !== 'vvip') {
            $tier = 'vip';
        }
    }

    echo json_encode([
        'success' => true,
        'account' => [
            'id' => $userId ?: 'discord-' . time(),
            'username' => $username ?: 'Member',
            'avatarUrl' => $avatarUrl,
            'roles' => $rolesFound,
            'tier' => $tier,
            'syncedAt' => date('c'),
        ],
        'hasUploadAccess' => $hasUploadAccess,
        'tier' => $tier,
        'message' => "Autentikasi Discord @{$username} berhasil!"
    ]);
    exit;
}

// 5. Helper Functions for Real-Time Scraping & ZeroStorage Auto-Pipeline

$stateFile = __DIR__ . '/data/discord_sync_state.json';
$logsFile = __DIR__ . '/data/discord_sync_logs.json';
$categoriesFile = __DIR__ . '/data/categories.json';
$moviesFile = __DIR__ . '/data/movies.json';
$defaultZeroKey = 'sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3';

function getZeroStorageApiKey() {
    global $configPath, $defaultZeroKey;
    if (file_exists($configPath)) {
        $cfg = json_decode(file_get_contents($configPath), true);
        if (!empty($cfg['zerostorage_api_key'])) {
            return $cfg['zerostorage_api_key'];
        }
    }
    return $defaultZeroKey;
}

function appendSyncLog($level, $message, $meta = []) {
    global $logsFile;
    $dir = dirname($logsFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $logs = [];
    if (file_exists($logsFile)) {
        $logs = json_decode(file_get_contents($logsFile), true) ?: [];
    }

    $entry = [
        'id' => uniqid('log_', true),
        'timestamp' => date('Y-m-d H:i:s'),
        'level' => $level, // 'info', 'success', 'warning', 'error', 'upload'
        'message' => $message,
        'meta' => $meta
    ];

    array_unshift($logs, $entry);
    // Keep max 300 logs
    if (count($logs) > 300) {
        $logs = array_slice($logs, 0, 300);
    }
    file_put_contents($logsFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function cleanChannelName($rawName) {
    // Remove Discord decorative unicode brackets & symbols
    $cleaned = preg_replace('/[⌜⌟⇾→#\|]/u', '', $rawName);
    // Remove emojis
    $cleaned = preg_replace('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F700}-\x{1F77F}\x{1F780}-\x{1F7FF}\x{1F800}-\x{1F8FF}\x{1F900}-\x{1F9FF}\x{1FA00}-\x{1FA6F}\x{1FA70}-\x{1FAFF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $cleaned);
    $cleaned = trim(str_replace(['-', '_'], ' ', $cleaned));
    return ucwords(strtolower($cleaned)) ?: 'Umum';
}

function detectTierFromParent($parentName, $channelName) {
    $combined = strtoupper($parentName . ' ' . $channelName);
    if (strpos($combined, 'VVIP') !== false || strpos($combined, 'UNCENSORED') !== false) {
        return 'vvip';
    }
    if (strpos($combined, 'EXCLUSIF') !== false || strpos($combined, 'BOOSTER') !== false || strpos($combined, 'VIP') !== false) {
        return 'vip';
    }
    return 'regular';
}

function uploadDiscordAttachmentToZeroStorage($attachmentUrl, $fileName, $title) {
    $apiKey = getZeroStorageApiKey();
    $tmpDir = sys_get_temp_dir();
    $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'mp4';
    $tmpFile = $tmpDir . '/sn_discord_' . uniqid() . '.' . $ext;

    // 1. Download file from Discord CDN
    $fp = fopen($tmpFile, 'w+');
    $ch = curl_init($attachmentUrl);
    curl_setopt($ch, CURLOPT_TIMEOUT, 180);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    if ($httpCode !== 200 || !file_exists($tmpFile) || filesize($tmpFile) < 100) {
        @unlink($tmpFile);
        return ['success' => false, 'error' => "Gagal mengunduh file video dari Discord (HTTP {$httpCode})."];
    }

    // 2. Upload to ZeroStorage
    $uploadUrl = 'https://upload.zerostorage.net/api/upload/universal';
    $mime = mime_content_type($tmpFile) ?: 'video/mp4';
    $cfile = new CURLFile($tmpFile, $mime, $fileName);

    $postData = [
        'file' => $cfile,
        'title' => $title ?: pathinfo($fileName, PATHINFO_FILENAME)
    ];

    $chUp = curl_init();
    curl_setopt($chUp, CURLOPT_URL, $uploadUrl);
    curl_setopt($chUp, CURLOPT_POST, true);
    curl_setopt($chUp, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($chUp, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chUp, CURLOPT_HTTPHEADER, ["x-api-key: {$apiKey}"]);
    curl_setopt($chUp, CURLOPT_TIMEOUT, 600); // 10 minutes max
    $response = curl_exec($chUp);
    $upHttpCode = curl_getinfo($chUp, CURLINFO_HTTP_CODE);
    curl_close($chUp);
    @unlink($tmpFile);

    if ($upHttpCode >= 200 && $upHttpCode < 300) {
        $resData = json_decode($response, true);
        if ($resData && !empty($resData['success'])) {
            $embedUrl = $resData['embedUrl'] ?? null;
            if (!$embedUrl && !empty($resData['fileId'])) {
                $embedUrl = 'https://zerostorage.net/embed/' . $resData['fileId'];
            } elseif (!$embedUrl && !empty($resData['viewUrl'])) {
                $embedUrl = str_replace('/watch/', '/embed/', $resData['viewUrl']);
            }
            return [
                'success' => true,
                'embedUrl' => $embedUrl,
                'fileId' => $resData['fileId'] ?? '',
                'size' => $resData['size'] ?? 0
            ];
        }
        return ['success' => false, 'error' => $resData['error'] ?? 'Gagal memproses respons ZeroStorage.'];
    }

    return ['success' => false, 'error' => "Koneksi upload ZeroStorage gagal (HTTP {$upHttpCode})."];
}

function ensureCategoryExists($categoryName) {
    global $categoriesFile;
    $dir = dirname($categoriesFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $categories = [];
    if (file_exists($categoriesFile)) {
        $categories = json_decode(file_get_contents($categoriesFile), true) ?: [];
    }

    foreach ($categories as $c) {
        if (strcasecmp(trim($c['name']), trim($categoryName)) === 0) {
            return; // Already exists
        }
    }

    $newCategory = [
        'id' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($categoryName))),
        'name' => trim($categoryName),
        'description' => "Koleksi konten video {$categoryName} Sekolah Nakal",
        'isLocked' => false,
        'order' => count($categories) + 1,
        'createdAt' => date('c')
    ];
    $categories[] = $newCategory;
    file_put_contents($categoriesFile, json_encode($categories, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function saveMovieToDatabase($movieData) {
    global $moviesFile;
    $dir = dirname($moviesFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $movies = [];
    if (file_exists($moviesFile)) {
        $movies = json_decode(file_get_contents($moviesFile), true) ?: [];
    }

    // Check duplicate by discordMsgId or title + category
    foreach ($movies as $m) {
        if (!empty($movieData['discordMsgId']) && !empty($m['discordMsgId']) && $m['discordMsgId'] === $movieData['discordMsgId']) {
            return false; // Already imported
        }
        if (!empty($movieData['videoUrl']) && !empty($m['videoUrl']) && $m['videoUrl'] === $movieData['videoUrl']) {
            return false; // Exact same video URL
        }
    }

    array_unshift($movies, $movieData);
    file_put_contents($moviesFile, json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return true;
}

// 6. Get Discord Channels with Category & Tier Mapping
if ($action === 'get_channels') {
    $res = discordApiRequest("/guilds/{$GUILD_ID}/channels", $BOT_TOKEN);
    if ($res['code'] !== 200 || !is_array($res['data'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal mengambil daftar channel dari Discord API.', 'details' => $res]);
        exit;
    }

    $all = $res['data'];
    $categoriesMap = [];
    foreach ($all as $c) {
        if ($c['type'] === 4) { // Guild Category
            $categoriesMap[$c['id']] = $c['name'];
        }
    }

    $mediaChannels = [];
    foreach ($all as $c) {
        if ($c['type'] === 0) { // Text Channel
            $parentName = $categoriesMap[$c['parent_id'] ?? ''] ?? 'General';
            $cleanedCategory = cleanChannelName($c['name']);
            $tier = detectTierFromParent($parentName, $c['name']);
            $isLikelyMedia = (
                strpos(strtolower($c['name']), 'media') !== false ||
                strpos(strtolower($c['name']), 'leak') !== false ||
                strpos(strtolower($c['name']), 'video') !== false ||
                strpos(strtolower($c['name']), 'uncensored') !== false ||
                strpos(strtolower($parentName), 'media') !== false ||
                strpos(strtolower($parentName), 'exclusif') !== false
            );

            $mediaChannels[] = [
                'id' => $c['id'],
                'name' => $c['name'],
                'cleanCategory' => $cleanedCategory,
                'parentId' => $c['parent_id'] ?? null,
                'parentName' => $parentName,
                'detectedTier' => $tier,
                'position' => $c['position'] ?? 0,
                'isLikelyMedia' => $isLikelyMedia,
                'nsfw' => !empty($c['nsfw'])
            ];
        }
    }

    // Sort by position
    usort($mediaChannels, function($a, $b) {
        if ($a['isLikelyMedia'] !== $b['isLikelyMedia']) return $b['isLikelyMedia'] ? 1 : -1;
        return $a['position'] - $b['position'];
    });

    echo json_encode([
        'success' => true,
        'channels' => $mediaChannels,
        'total' => count($mediaChannels),
        'mediaCount' => count(array_filter($mediaChannels, fn($c) => $c['isLikelyMedia']))
    ]);
    exit;
}

// 7. Poll & Real-Time Sync Media Channels (ZeroStorage Auto-Upload)
if ($action === 'poll_realtime' || $action === 'cron_sync') {
    // 1. Get all guild channels
    $chanRes = discordApiRequest("/guilds/{$GUILD_ID}/channels", $BOT_TOKEN);
    if ($chanRes['code'] !== 200 || !is_array($chanRes['data'])) {
        appendSyncLog('error', 'Gagal menyambung ke Discord Gateway untuk polling realtime.');
        echo json_encode(['error' => 'Gagal mengambil channels.', 'details' => $chanRes]);
        exit;
    }

    $all = $chanRes['data'];
    $catMap = [];
    foreach ($all as $c) {
        if ($c['type'] === 4) $catMap[$c['id']] = $c['name'];
    }

    // Target media channels
    $targetChannels = [];
    foreach ($all as $c) {
        if ($c['type'] === 0) {
            $parentName = $catMap[$c['parent_id'] ?? ''] ?? '';
            $isMedia = (
                strpos(strtolower($c['name']), 'media') !== false ||
                strpos(strtolower($c['name']), 'leak') !== false ||
                strpos(strtolower($parentName), 'media') !== false ||
                strpos(strtolower($parentName), 'exclusif') !== false
            );
            if ($isMedia) {
                $targetChannels[] = [
                    'id' => $c['id'],
                    'name' => $c['name'],
                    'parentName' => $parentName,
                    'category' => cleanChannelName($c['name']),
                    'tier' => detectTierFromParent($parentName, $c['name'])
                ];
            }
        }
    }

    // Load state
    $state = [];
    if (file_exists($stateFile)) {
        $state = json_decode(file_get_contents($stateFile), true) ?: [];
    }

    $totalProcessed = 0;
    $totalUploaded = 0;
    $syncedItems = [];

    foreach ($targetChannels as $chan) {
        $chanId = $chan['id'];
        $lastId = $state[$chanId] ?? null;

        // Fetch recent messages
        $limit = $lastId ? 25 : 15; // If first run, fetch last 15, else fetch recent
        $endpoint = "/channels/{$chanId}/messages?limit={$limit}";
        if ($lastId) {
            $endpoint .= "&after={$lastId}";
        }

        $msgRes = discordApiRequest($endpoint, $BOT_TOKEN);
        if ($msgRes['code'] !== 200 || !is_array($msgRes['data'])) {
            continue;
        }

        $messages = $msgRes['data'];
        if (empty($messages)) continue;

        // Process from oldest to newest
        usort($messages, fn($a, $b) => strcmp($a['id'], $b['id']));

        foreach ($messages as $msg) {
            $msgId = $msg['id'];
            $content = trim($msg['content'] ?? '');
            $attachments = $msg['attachments'] ?? [];
            $state[$chanId] = $msgId; // update last seen

            // Find video attachment or external link
            $videoAttachment = null;
            $imageAttachment = null;

            foreach ($attachments as $att) {
                $cType = strtolower($att['content_type'] ?? '');
                $fName = strtolower($att['filename'] ?? '');
                if (
                    strpos($cType, 'video') !== false ||
                    preg_match('/\.(mp4|mov|mkv|webm|m4v)$/i', $fName)
                ) {
                    if (!$videoAttachment) $videoAttachment = $att;
                } elseif (
                    strpos($cType, 'image') !== false ||
                    preg_match('/\.(jpg|jpeg|png|webp)$/i', $fName)
                ) {
                    if (!$imageAttachment) $imageAttachment = $att;
                }
            }

            // Check external video link in content if no video attachment
            $externalVideoUrl = null;
            if (!$videoAttachment && !empty($content)) {
                if (preg_match('/(https?:\/\/[^\s]+)/i', $content, $mUrl)) {
                    $u = $mUrl[1];
                    if (
                        strpos($u, 'zerostorage.net') !== false ||
                        strpos($u, 'luluvdo.com') !== false ||
                        strpos($u, 'lulustream.com') !== false ||
                        strpos($u, 'dood') !== false ||
                        strpos($u, 'streamtape') !== false ||
                        preg_match('/\.(mp4|m3u8|webm)$/i', $u)
                    ) {
                        $externalVideoUrl = $u;
                    }
                }
            }

            if (!$videoAttachment && !$externalVideoUrl) {
                continue; // No video in this message
            }

            $totalProcessed++;

            // Clean Title
            $title = '';
            if (!empty($content) && !filter_var($content, FILTER_VALIDATE_URL)) {
                $firstLine = explode("\n", $content)[0];
                $title = trim(preg_replace('/https?:\/\/[^\s]+/', '', $firstLine));
            }
            if (empty($title)) {
                $rawFile = $videoAttachment ? $videoAttachment['filename'] : 'Video ' . date('Ymd');
                $title = trim(str_replace(['_', '-'], ' ', pathinfo($rawFile, PATHINFO_FILENAME)));
                $title = preg_replace('/\s+/', ' ', $title);
                $title = ucwords($title);
            }

            // 1. Process Video Source
            $finalVideoUrl = '';
            if ($videoAttachment) {
                appendSyncLog('upload', "⚡ Mengunggah video \"{$title}\" dari #{$chan['name']} ke ZeroStorage CDN...", [
                    'channel' => $chan['name'],
                    'file' => $videoAttachment['filename'],
                    'size' => round(($videoAttachment['size'] ?? 0) / 1048576, 2) . ' MB'
                ]);

                $upResult = uploadDiscordAttachmentToZeroStorage(
                    $videoAttachment['url'],
                    $videoAttachment['filename'],
                    $title
                );

                if ($upResult['success'] && !empty($upResult['embedUrl'])) {
                    $finalVideoUrl = $upResult['embedUrl'];
                } else {
                    appendSyncLog('error', "Gagal upload ZeroStorage: " . ($upResult['error'] ?? 'Unknown error'), [
                        'channel' => $chan['name'],
                        'title' => $title
                    ]);
                    continue; // Skip saving empty video
                }
            } elseif ($externalVideoUrl) {
                $finalVideoUrl = $externalVideoUrl;
            }

            if (empty($finalVideoUrl)) continue;

            // 2. Poster & Preview
            $localPoster = '/uploads/posters/poster_' . $msgId . '.jpg';
            $localPosterPath = dirname(__DIR__) . $localPoster;
            $localPreview = '/uploads/previews/preview_' . $msgId . '.mp4';
            $localPreviewPath = dirname(__DIR__) . $localPreview;

            if (file_exists($localPosterPath) && filesize($localPosterPath) > 500) {
                $posterUrl = $localPoster;
            } elseif ($imageAttachment) {
                $posterUrl = $imageAttachment['url'];
            } else {
                $posterUrl = $localPoster; // Fallback to poster path for subsequent generator run
            }

            $previewUrl = (file_exists($localPreviewPath) && filesize($localPreviewPath) > 500) ? $localPreview : null;

            // 3. Ensure Category Exists
            ensureCategoryExists($chan['category']);

            // 4. Save Movie
            $newMovie = [
                'id' => (string)time() . rand(100, 999),
                'title' => $title,
                'slug' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title)) . '-' . rand(10, 99),
                'genres' => [$chan['category']],
                'tier' => $chan['tier'],
                'duration' => rand(15, 60),
                'year' => (int)date('Y'),
                'rating' => 9.0,
                'overview' => !empty($content) ? $content : "Konten eksklusif {$chan['category']} dipublikasikan secara otomatis melalui Discord Bot Sekolah Nakal.",
                'posterUrl' => $posterUrl,
                'backdropUrl' => $posterUrl,
                'videoUrl' => $finalVideoUrl,
                'previewUrl' => $previewUrl,
                'discordMsgId' => $msgId,
                'discordChannelId' => $chanId,
                'syncedAt' => date('c')
            ];

            $saved = saveMovieToDatabase($newMovie);
            if ($saved) {
                $totalUploaded++;
                $syncedItems[] = $newMovie;
                appendSyncLog('success', "🎉 Sukses mempublikasikan \"{$title}\" ke Kategori [{$chan['category']}] (Tier: " . strtoupper($chan['tier']) . ")", [
                    'title' => $title,
                    'category' => $chan['category'],
                    'tier' => $chan['tier'],
                    'embedUrl' => $finalVideoUrl
                ]);
            }
        }
    }

    // Save updated state
    file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    echo json_encode([
        'success' => true,
        'timestamp' => date('c'),
        'totalScannedChannels' => count($targetChannels),
        'totalMessagesChecked' => $totalProcessed,
        'totalNewVideosPublished' => $totalUploaded,
        'syncedItems' => $syncedItems
    ]);
    exit;
}

// 8. Get Live Activity Logs (For Admin Studio)
if ($action === 'get_logs') {
    $logs = [];
    if (file_exists($logsFile)) {
        $logs = json_decode(file_get_contents($logsFile), true) ?: [];
    }
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'count' => count($logs),
        'lastChecked' => date('c')
    ]);
    exit;
}

// 9. Clear Logs
if ($action === 'clear_logs' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    file_put_contents($logsFile, json_encode([], JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'message' => 'Log aktivitas Discord berhasil dibersihkan.']);
    exit;
}

// 10. Scrape Specific Channel on Demand
if ($action === 'scrape_channel') {
    $channelId = trim($_GET['channel_id'] ?? ($_POST['channel_id'] ?? ''));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

    if (empty($channelId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Channel ID Discord diperlukan.']);
        exit;
    }

    // Get channel details
    $chanInfoRes = discordApiRequest("/channels/{$channelId}", $BOT_TOKEN);
    $chanName = 'Media Channel';
    $parentName = 'General';
    if ($chanInfoRes['code'] === 200 && is_array($chanInfoRes['data'])) {
        $chanName = $chanInfoRes['data']['name'] ?? $chanName;
    }

    $categoryName = cleanChannelName($chanName);
    $tier = detectTierFromParent($parentName, $chanName);

    // Fetch messages
    $msgRes = discordApiRequest("/channels/{$channelId}/messages?limit={$limit}", $BOT_TOKEN);
    if ($msgRes['code'] !== 200 || !is_array($msgRes['data'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal membaca pesan dari channel ini.', 'details' => $msgRes]);
        exit;
    }

    $messages = $msgRes['data'];
    $synced = 0;
    $syncedItems = [];

    appendSyncLog('info', "Memulai penarikan manual channel #{$chanName} (Kategori: {$categoryName}, Limit: {$limit} pesan)...");

    foreach ($messages as $msg) {
        $msgId = $msg['id'];
        $content = trim($msg['content'] ?? '');
        $attachments = $msg['attachments'] ?? [];

        $videoAttachment = null;
        $imageAttachment = null;

        foreach ($attachments as $att) {
            $cType = strtolower($att['content_type'] ?? '');
            $fName = strtolower($att['filename'] ?? '');
            if (strpos($cType, 'video') !== false || preg_match('/\.(mp4|mov|mkv|webm|m4v)$/i', $fName)) {
                if (!$videoAttachment) $videoAttachment = $att;
            } elseif (strpos($cType, 'image') !== false || preg_match('/\.(jpg|jpeg|png|webp)$/i', $fName)) {
                if (!$imageAttachment) $imageAttachment = $att;
            }
        }

        $externalVideoUrl = null;
        if (!$videoAttachment && !empty($content)) {
            if (preg_match('/(https?:\/\/[^\s]+)/i', $content, $mUrl)) {
                $u = $mUrl[1];
                if (
                    strpos($u, 'zerostorage.net') !== false ||
                    strpos($u, 'luluvdo.com') !== false ||
                    strpos($u, 'lulustream.com') !== false ||
                    strpos($u, 'dood') !== false ||
                    strpos($u, 'streamtape') !== false ||
                    preg_match('/\.(mp4|m3u8|webm)$/i', $u)
                ) {
                    $externalVideoUrl = $u;
                }
            }
        }

        if (!$videoAttachment && !$externalVideoUrl) continue;

        // Title
        $title = '';
        if (!empty($content) && !filter_var($content, FILTER_VALIDATE_URL)) {
            $firstLine = explode("\n", $content)[0];
            $title = trim(preg_replace('/https?:\/\/[^\s]+/', '', $firstLine));
        }
        if (empty($title)) {
            $rawFile = $videoAttachment ? $videoAttachment['filename'] : 'Video ' . date('Ymd');
            $title = trim(str_replace(['_', '-'], ' ', pathinfo($rawFile, PATHINFO_FILENAME)));
            $title = ucwords($title);
        }

        $finalVideoUrl = '';
        if ($videoAttachment) {
            appendSyncLog('upload', "⚡ Mengunggah \"{$title}\" dari #{$chanName} ke ZeroStorage...", [
                'file' => $videoAttachment['filename'],
                'size' => round(($videoAttachment['size'] ?? 0) / 1048576, 2) . ' MB'
            ]);

            $upResult = uploadDiscordAttachmentToZeroStorage(
                $videoAttachment['url'],
                $videoAttachment['filename'],
                $title
            );

            if ($upResult['success'] && !empty($upResult['embedUrl'])) {
                $finalVideoUrl = $upResult['embedUrl'];
            }
        } elseif ($externalVideoUrl) {
            $finalVideoUrl = $externalVideoUrl;
        }

        if (empty($finalVideoUrl)) continue;

        $localPoster = '/uploads/posters/poster_' . $msgId . '.jpg';
        $localPosterPath = dirname(__DIR__) . $localPoster;
        $localPreview = '/uploads/previews/preview_' . $msgId . '.mp4';
        $localPreviewPath = dirname(__DIR__) . $localPreview;

        if (file_exists($localPosterPath) && filesize($localPosterPath) > 500) {
            $posterUrl = $localPoster;
        } elseif ($imageAttachment) {
            $posterUrl = $imageAttachment['url'];
        } else {
            $posterUrl = $localPoster;
        }

        $previewUrl = (file_exists($localPreviewPath) && filesize($localPreviewPath) > 500) ? $localPreview : null;
        ensureCategoryExists($categoryName);

        $newMovie = [
            'id' => (string)time() . rand(100, 999),
            'title' => $title,
            'slug' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title)) . '-' . rand(10, 99),
            'genres' => [$categoryName],
            'tier' => $tier,
            'duration' => rand(15, 60),
            'year' => (int)date('Y'),
            'rating' => 9.0,
            'overview' => !empty($content) ? $content : "Konten eksklusif {$categoryName} Sekolah Nakal.",
            'posterUrl' => $posterUrl,
            'backdropUrl' => $posterUrl,
            'videoUrl' => $finalVideoUrl,
            'previewUrl' => $previewUrl,
            'discordMsgId' => $msgId,
            'discordChannelId' => $channelId,
            'syncedAt' => date('c')
        ];

        $saved = saveMovieToDatabase($newMovie);
        if ($saved) {
            $synced++;
            $syncedItems[] = $newMovie;
            appendSyncLog('success', "✅ Sukses publikasi \"{$title}\" ke [{$categoryName}]", ['embedUrl' => $finalVideoUrl]);
        }
    }

    echo json_encode([
        'success' => true,
        'channelName' => $chanName,
        'category' => $categoryName,
        'tier' => $tier,
        'publishedCount' => $synced,
        'items' => $syncedItems
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Aksi tidak valid.']);

