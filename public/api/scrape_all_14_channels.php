<?php
/**
 * Master Batch Scraper for 14 Discord Channels (Sekolah Nakal)
 * Runs via CLI or Web Admin to scrape all 14 channels into ZeroStorage + movies.json
 */

set_time_limit(0);
ini_set('memory_limit', '1024M');

$BOT_TOKEN = getenv('DISCORD_BOT_TOKEN') ?: ('MTU0MjcyNjkwNDg2MjIxNjM2Mw' . '.GRYwHk' . '.jz20_RMP5ATGIDQPvLUhgLW039ytQPo_FzaApk');
$ZEROSTORAGE_KEY = getenv('ZEROSTORAGE_API_KEY') ?: 'sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3';

$WEB_ROOT = dirname(__DIR__);
$DATA_DIR = __DIR__ . '/data';
$MOVIES_FILE = $DATA_DIR . '/movies.json';
$POSTER_DIR = $WEB_ROOT . '/uploads/posters';
$PREVIEW_DIR = $WEB_ROOT . '/uploads/previews';
$FFMPEG = file_exists('/home/u948854164/bin/ffmpeg') ? '/home/u948854164/bin/ffmpeg' : 'ffmpeg';

@mkdir($DATA_DIR, 0777, true);
@mkdir($POSTER_DIR, 0777, true);
@mkdir($PREVIEW_DIR, 0777, true);

$TARGET_CHANNELS = [
    '1481796670252388362' => ['name' => '⌜🔞⌟⇾media-forward', 'category' => 'Media Forward', 'tier' => 'regular'],
    '1402628509112864769' => ['name' => '⌜🔞⌟⇾media-barat', 'category' => 'Media Barat', 'tier' => 'regular'],
    '1402628474157400074' => ['name' => '⌜🔞⌟⇾media-asia', 'category' => 'Media Asia', 'tier' => 'regular'],
    '1402627069392715876' => ['name' => '⌜🔞⌟⇾media-lokal', 'category' => 'Media Lokal', 'tier' => 'regular'],
    '1403283149508710410' => ['name' => '⌜💎⌟⇾media-lokal', 'category' => 'Media Lokal', 'tier' => 'vip'],
    '1403698007261712455' => ['name' => '⌜💎⌟⇾media-asia', 'category' => 'Media Asia', 'tier' => 'vip'],
    '1434557709859950663' => ['name' => '⌜💎⌟⇾media-arab', 'category' => 'Media Arab', 'tier' => 'vip'],
    '1408159322780733491' => ['name' => '⌜💎⌟⇾media-china', 'category' => 'Media China', 'tier' => 'vip'],
    '1433196972252336169' => ['name' => '⌜💎⌟⇾media-korea', 'category' => 'Media Korea', 'tier' => 'vip'],
    '1403698066317639741' => ['name' => '⌜💎⌟⇾media-jepang', 'category' => 'Media Jepang', 'tier' => 'vip'],
    '1433197442656112681' => ['name' => '⌜💎⌟⇾media-taiwan', 'category' => 'Media Taiwan', 'tier' => 'vip'],
    '1434557739694035034' => ['name' => '⌜💎⌟⇾media-india', 'category' => 'Media India', 'tier' => 'vip'],
    '1433027001320476712' => ['name' => '⌜💎⌟⇾media-latin', 'category' => 'Media Latin', 'tier' => 'vip'],
    '1403698038329053296' => ['name' => '⌜💎⌟⇾media-barat', 'category' => 'Media Barat', 'tier' => 'vip'],
];

function logMsg($msg) {
    echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    if (ob_get_level() > 0) ob_flush();
    flush();
}

function getExistingMovies($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveMovies($file, $movies) {
    $content = json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    file_put_contents($file, $content, LOCK_EX);

    // Also sync to mirror docroot
    $altPaths = [
        '/home/u948854164/domains/sekolahnakal.so791.com/public_html/api/data/movies.json',
        '/home/u948854164/public_html/api/data/movies.json'
    ];
    foreach ($altPaths as $alt) {
        if ($alt !== $file && is_dir(dirname($alt))) {
            @file_put_contents($alt, $content, LOCK_EX);
        }
    }
}

function uploadToZeroStorageDirect($filePath, $title, $apiKey) {
    $ch = curl_init('https://upload.zerostorage.net/api/upload/universal');
    $cfile = new CURLFile($filePath, 'video/mp4', basename($filePath));
    $postData = [
        'file' => $cfile,
        'title' => $title
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: {$apiKey}"]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $res) {
        $json = json_decode($res, true);
        if (!empty($json['fileId'])) {
            return [
                'success' => true,
                'fileId' => $json['fileId'],
                'streamUrl' => "https://zerostorage.net/api/files/{$json['fileId']}/stream",
                'embedUrl' => "https://zerostorage.net/embed/{$json['fileId']}"
            ];
        }
    }
    return ['success' => false, 'raw' => $res, 'httpCode' => $httpCode, 'error' => $err];
}

$chanKeys = array_keys($TARGET_CHANNELS);
$selectedChannels = $TARGET_CHANNELS;
$currentChanIdx = null;

if (isset($_GET['chan_idx'])) {
    $idx = (int)$_GET['chan_idx'];
    if (isset($chanKeys[$idx])) {
        $cId = $chanKeys[$idx];
        $selectedChannels = [$cId => $TARGET_CHANNELS[$cId]];
        $currentChanIdx = $idx;
    }
} elseif (isset($_GET['channel_id'])) {
    $cId = trim($_GET['channel_id']);
    if (isset($TARGET_CHANNELS[$cId])) {
        $selectedChannels = [$cId => $TARGET_CHANNELS[$cId]];
        $currentChanIdx = array_search($cId, $chanKeys);
    }
}

$msgLimit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 100;

$movies = getExistingMovies($MOVIES_FILE);
$existingMsgIds = [];
foreach ($movies as $m) {
    if (!empty($m['discordMsgId'])) {
        $existingMsgIds[$m['discordMsgId']] = true;
    }
}

logMsg("Total existing movies in database: " . count($movies));
$totalNewPublished = 0;

foreach ($selectedChannels as $chanId => $meta) {
    logMsg("--------------------------------------------------");
    logMsg("Scanning Channel: {$meta['name']} (ID: {$chanId}, Tier: {$meta['tier']}, Cat: {$meta['category']})");

    // Fetch messages
    $ch = curl_init("https://discord.com/api/v10/channels/{$chanId}/messages?limit={$msgLimit}");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bot {$BOT_TOKEN}",
        "User-Agent: DiscordBot (https://sekolahnakal.com, 1.0)"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    curl_close($ch);

    $messages = json_decode($res, true);
    if (!is_array($messages)) {
        logMsg("Failed to fetch messages for channel {$chanId}");
        continue;
    }

    logMsg("Found " . count($messages) . " messages in channel {$meta['name']}");

    // Sort oldest to newest
    usort($messages, fn($a, $b) => strcmp($a['id'], $b['id']));

    foreach ($messages as $msg) {
        $msgId = $msg['id'];
        if (isset($existingMsgIds[$msgId])) {
            continue; // already in database
        }

        $attachments = $msg['attachments'] ?? [];
        $content = trim($msg['content'] ?? '');
        $videoAtt = null;

        foreach ($attachments as $att) {
            $cType = strtolower($att['content_type'] ?? '');
            $fName = strtolower($att['filename'] ?? '');
            if (strpos($cType, 'video') !== false || preg_match('/\.(mp4|mov|mkv|webm|m4v)$/i', $fName)) {
                $videoAtt = $att;
                break;
            }
        }

        if (!$videoAtt) continue;

        // Clean title
        $title = '';
        if (!empty($content) && !filter_var($content, FILTER_VALIDATE_URL)) {
            $firstLine = explode("\n", $content)[0];
            $title = trim(preg_replace('/https?:\/\/[^\s]+/', '', $firstLine));
        }
        if (empty($title)) {
            $rawFile = $videoAtt['filename'];
            $title = trim(str_replace(['_', '-'], ' ', pathinfo($rawFile, PATHINFO_FILENAME)));
            $title = ucwords($title);
        }

        logMsg("Processing: [{$meta['category']}] {$title} (Msg: {$msgId}, Size: " . round(($videoAtt['size'] ?? 0)/1048576, 2) . " MB)...");

        // Download video to /tmp
        $tmpVid = "/tmp/sn_vid_{$msgId}.mp4";
        $fp = fopen($tmpVid, 'w+');
        $ch = curl_init($videoAtt['url']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_exec($ch);
        $dlCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);

        if (!file_exists($tmpVid) || filesize($tmpVid) < 1000) {
            logMsg("  -> Download failed (HTTP {$dlCode}, Size: " . (file_exists($tmpVid) ? filesize($tmpVid) : 0) . " bytes).");
            @unlink($tmpVid);
            continue;
        }

        // Upload to ZeroStorage
        logMsg("  -> Uploading to ZeroStorage CDN...");
        $upRes = uploadToZeroStorageDirect($tmpVid, $title, $ZEROSTORAGE_KEY);
        if (!$upRes['success']) {
            logMsg("  -> ZeroStorage upload failed: " . json_encode($upRes));
            @unlink($tmpVid);
            continue;
        }

        $videoStreamUrl = $upRes['streamUrl'];
        $videoEmbedUrl = $upRes['embedUrl'];

        // Extract poster snapshot
        $posterFile = $POSTER_DIR . "/poster_{$msgId}.jpg";
        $previewFile = $PREVIEW_DIR . "/preview_{$msgId}.mp4";

        exec("{$FFMPEG} -threads 1 -i {$tmpVid} -ss 00:00:01 -vframes 1 -threads 1 -y {$posterFile} 2>/dev/null");
        exec("{$FFMPEG} -threads 1 -ss 00:00:01 -i {$tmpVid} -t 3 -vf 'scale=480:-2' -c:v libx264 -crf 28 -an -threads 1 -y {$previewFile} 2>/dev/null");

        @unlink($tmpVid);

        $posterUrl = (file_exists($posterFile) && filesize($posterFile) > 500) ? "/uploads/posters/poster_{$msgId}.jpg" : "/images/logo_v2.png";
        $previewUrl = (file_exists($previewFile) && filesize($previewFile) > 500) ? "/uploads/previews/preview_{$msgId}.mp4" : null;

        $newMovie = [
            'id' => (string)time() . rand(100, 999),
            'title' => $title,
            'slug' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title)) . '-' . rand(10, 99),
            'genres' => [$meta['category']],
            'tier' => $meta['tier'],
            'duration' => rand(20, 60),
            'year' => (int)date('Y'),
            'rating' => 9.0,
            'overview' => "Konten eksklusif {$meta['category']} dipublikasikan secara otomatis melalui Discord Bot Sekolah Nakal.",
            'posterUrl' => $posterUrl,
            'backdropUrl' => $posterUrl,
            'videoUrl' => $videoStreamUrl,
            'previewUrl' => $previewUrl,
            'discordMsgId' => $msgId,
            'discordChannelId' => $chanId,
            'syncedAt' => date('c')
        ];

        array_unshift($movies, $newMovie);
        $existingMsgIds[$msgId] = true;
        $totalNewPublished++;
        saveMovies($MOVIES_FILE, $movies);

        logMsg("  -> SUCCESS! Published to {$meta['category']} ({$meta['tier']}): {$videoStreamUrl}");
    }
}

logMsg("==================================================");
logMsg("BATCH SCRAPING CHUNK COMPLETED! Total new published: {$totalNewPublished}");
$nextIdx = ($currentChanIdx !== null && $currentChanIdx < count($chanKeys) - 1) ? $currentChanIdx + 1 : null;
echo json_encode([
    'success' => true,
    'currentChanIdx' => $currentChanIdx,
    'nextChanIdx' => $nextIdx,
    'totalNewPublished' => $totalNewPublished,
    'totalDatabaseMovies' => count($movies)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
