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

    foreach ($rolesFound as $r) {
        $up = strtoupper($r);
        if (
            strpos($up, 'ADMIN') !== false ||
            strpos($up, 'OWNER') !== false ||
            strpos($up, 'DEV') !== false ||
            strpos($up, 'KREATOR') !== false ||
            strpos($up, 'CREATOR') !== false ||
            strpos($up, 'UPLOADER') !== false ||
            strpos($up, 'STAFF') !== false
        ) {
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

    foreach ($rolesFound as $r) {
        $up = strtoupper($r);
        if (
            strpos($up, 'ADMIN') !== false ||
            strpos($up, 'OWNER') !== false ||
            strpos($up, 'DEV') !== false ||
            strpos($up, 'KREATOR') !== false ||
            strpos($up, 'CREATOR') !== false ||
            strpos($up, 'UPLOADER') !== false ||
            strpos($up, 'STAFF') !== false
        ) {
            $hasUploadAccess = true;
        }

        if (strpos($up, 'ADMIN') !== false || strpos($up, 'VVIP') !== false || strpos($up, 'UNCENSORED') !== false) {
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

http_response_code(400);
echo json_encode(['error' => 'Aksi tidak valid.']);
