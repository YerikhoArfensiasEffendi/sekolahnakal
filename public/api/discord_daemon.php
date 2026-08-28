<?php
/**
 * Discord Real-time Sync Daemon (Sekolah Nakal)
 * Run in background: php -f public/api/discord_daemon.php
 * Or via Cron: php public/api/discord_daemon.php --once
 */

// Allow infinite execution time for CLI daemon
if (php_sapi_name() === 'cli') {
    set_time_limit(0);
    ini_set('memory_limit', '512M');
}

$isOnce = in_array('--once', $argv ?? []) || in_array('-1', $argv ?? []);

echo "[" . date('Y-m-d H:i:s') . "] 🟢 Starting Discord Sync Daemon...\n";

// Execute sync via discord.php
$_GET['action'] = 'poll_realtime';
require_once __DIR__ . '/discord.php';

if (!$isOnce && php_sapi_name() === 'cli') {
    // Daemon loop (polling every 10 seconds)
    while (true) {
        sleep(10);
        ob_start();
        $_GET['action'] = 'poll_realtime';
        include __DIR__ . '/discord.php';
        $out = ob_get_clean();
        $res = json_decode($out, true);
        if ($res && !empty($res['totalNewVideosPublished'])) {
            echo "[" . date('Y-m-d H:i:s') . "] 🎉 New videos published: {$res['totalNewVideosPublished']}\n";
        }
    }
}
