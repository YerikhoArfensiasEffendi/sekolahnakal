<?php
/**
 * Discord Real-time Auto-Sync & Scraper Daemon (Sekolah Nakal)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Penggunaan:
 * 1. Via Hostinger hPanel Cron Job (Direkomendasikan):
 *    Command: /usr/bin/php /home/u948854164/domains/sekolahnakal.so791.com/public_html/api/discord_daemon.php --cron
 * 
 * 2. Via Web Cron URL (cron-job.org / UptimeRobot):
 *    URL: https://sekolahnakal.so791.com/api/discord_daemon.php?cron=1
 * 
 * 3. Via Background Daemon SSH:
 *    setsid nohup php /home/u948854164/domains/sekolahnakal.so791.com/public_html/api/discord_daemon.php --daemon > /home/u948854164/discord_daemon.log 2>&1 &
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Disable execution time limit for long scraper tasks
if (php_sapi_name() === 'cli') {
    set_time_limit(0);
    ini_set('memory_limit', '1024M');
} else {
    set_time_limit(300);
}

$isCli = (php_sapi_name() === 'cli');
$isDaemon = $isCli && in_array('--daemon', $argv ?? []);
$interval = 30; // seconds

function executeSync() {
    $apiUrl = 'https://sekolahnakal.so791.com/api/discord.php?action=poll_realtime';
    
    // Also try local direct inclusion or loopback curl
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 280);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_USERAGENT, 'SekolahNakal-Server-Daemon/2.0');
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    // Also sync payments
    $payUrl = 'https://sekolahnakal.so791.com/api/discord.php?action=get_payments&refresh=1';
    $chP = curl_init($payUrl);
    curl_setopt($chP, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chP, CURLOPT_TIMEOUT, 30);
    curl_setopt($chP, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($chP, CURLOPT_SSL_VERIFYHOST, 0);
    curl_exec($chP);
    curl_close($chP);

    return [
        'timestamp' => date('Y-m-d H:i:s'),
        'httpCode' => $httpCode,
        'result' => $data ?: ['raw' => $response, 'error' => $error]
    ];
}

if ($isDaemon) {
    echo "[" . date('Y-m-d H:i:s') . "] 🟢 Starting Sekolah Nakal Background Daemon (Polling every {$interval}s)...\n";
    while (true) {
        $res = executeSync();
        $newCount = $res['result']['totalNewVideosPublished'] ?? 0;
        if ($newCount > 0) {
            echo "[{$res['timestamp']}] 🎉 Published {$newCount} new videos from Discord!\n";
        } else {
            echo "[{$res['timestamp']}] 💤 Checked channels — No new videos pending.\n";
        }
        sleep($interval);
    }
} else {
    // Single Run (Cron / Webhook Request)
    $res = executeSync();
    echo json_encode([
        'success' => true,
        'mode' => $isCli ? 'cli_cron' : 'web_cron',
        'execution' => $res
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
