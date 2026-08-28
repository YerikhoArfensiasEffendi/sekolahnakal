<?php
/**
 * Automated Video Snapshot Thumbnail & Preview Clip Generator
 * Sekolah Nakal - Discord Media Pipeline
 */

$moviesFile = __DIR__ . '/data/movies.json';
$posterDir = dirname(__DIR__) . '/uploads/posters';
$previewDir = dirname(__DIR__) . '/uploads/previews';

if (!is_dir($posterDir)) @mkdir($posterDir, 0777, true);
if (!is_dir($previewDir)) @mkdir($previewDir, 0777, true);

if (!file_exists($moviesFile)) {
    die("movies.json not found\n");
}

$movies = json_decode(file_get_contents($moviesFile), true) ?: [];
$token = getenv('DISCORD_BOT_TOKEN') ?: 'YOUR_DISCORD_BOT_TOKEN';
$ffmpeg = "/home/u948854164/bin/ffmpeg";
if (!file_exists($ffmpeg)) {
    $ffmpeg = "ffmpeg";
}

$updatedCount = 0;
echo "Starting thumbnail extraction for " . count($movies) . " movies...\n";

foreach ($movies as &$movie) {
    $msgId = $movie['discordMsgId'] ?? null;
    $chanId = $movie['discordChannelId'] ?? null;
    $movieId = $movie['id'] ?? uniqid();
    $cleanId = $msgId ?: $movieId;

    $posterPath = $posterDir . '/poster_' . $cleanId . '.jpg';
    $previewPath = $previewDir . '/preview_' . $cleanId . '.mp4';
    $webPoster = '/uploads/posters/poster_' . $cleanId . '.jpg';
    $webPreview = '/uploads/previews/preview_' . $cleanId . '.mp4';

    // If poster already exists, just make sure movie has the url
    if (file_exists($posterPath) && filesize($posterPath) > 500) {
        $movie['posterUrl'] = $webPoster;
        $movie['backdropUrl'] = $webPoster;
        if (file_exists($previewPath) && filesize($previewPath) > 500) {
            $movie['previewUrl'] = $webPreview;
        }
        $updatedCount++;
        continue;
    }

    if (!$msgId || !$chanId) {
        continue;
    }

    echo "Processing [{$cleanId}] " . substr($movie['title'], 0, 30) . "... ";

    // Fetch fresh message from Discord API
    $ch = curl_init("https://discord.com/api/v10/channels/{$chanId}/messages/{$msgId}");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bot {$token}",
        "User-Agent: SekolahNakalBot/1.0"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $res = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http !== 200) {
        echo "Failed to fetch Discord msg (HTTP {$http})\n";
        continue;
    }

    $msgData = json_decode($res, true);
    $videoAttachment = null;
    if (!empty($msgData['attachments'])) {
        foreach ($msgData['attachments'] as $att) {
            $fn = strtolower($att['filename'] ?? '');
            if (preg_match('/\.(mp4|mov|mkv|webm|m4v)$/i', $fn) || str_starts_with($att['content_type'] ?? '', 'video/')) {
                $videoAttachment = $att;
                break;
            }
        }
    }

    if (!$videoAttachment || empty($videoAttachment['url'])) {
        echo "No video attachment found in message.\n";
        continue;
    }

    $tmpVid = sys_get_temp_dir() . '/gen_vid_' . $cleanId . '.mp4';
    $fp = fopen($tmpVid, 'w+');
    $chD = curl_init($videoAttachment['url']);
    curl_setopt($chD, CURLOPT_FILE, $fp);
    curl_setopt($chD, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($chD, CURLOPT_TIMEOUT, 120);
    curl_setopt($chD, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_exec($chD);
    fclose($fp);
    curl_close($chD);

    if (!file_exists($tmpVid) || filesize($tmpVid) < 1000) {
        @unlink($tmpVid);
        echo "Failed to download video file.\n";
        continue;
    }

    // Run ffmpeg frame snapshot extraction
    $cmdPoster = "{$ffmpeg} -threads 1 -i " . escapeshellarg($tmpVid) . " -ss 00:00:01 -vframes 1 -threads 1 -y " . escapeshellarg($posterPath) . " 2>&1";
    shell_exec($cmdPoster);

    // Run ffmpeg 3s hover preview extraction
    $cmdPreview = "{$ffmpeg} -threads 1 -ss 00:00:01 -i " . escapeshellarg($tmpVid) . " -t 3 -vf \"scale=480:-2\" -c:v libx264 -crf 28 -an -threads 1 -y " . escapeshellarg($previewPath) . " 2>&1";
    shell_exec($cmdPreview);

    @unlink($tmpVid);

    if (file_exists($posterPath) && filesize($posterPath) > 500) {
        $movie['posterUrl'] = $webPoster;
        $movie['backdropUrl'] = $webPoster;
        if (file_exists($previewPath) && filesize($previewPath) > 500) {
            $movie['previewUrl'] = $webPreview;
        }
        $updatedCount++;
        echo "OK! Snapshot saved.\n";
    } else {
        echo "FFmpeg failed to extract snapshot.\n";
    }
}

file_put_contents($moviesFile, json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Finished! Total {$updatedCount} movies updated with real video thumbnails and previews.\n";
