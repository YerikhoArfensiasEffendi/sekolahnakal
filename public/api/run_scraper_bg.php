<?php
/**
 * Background Scraper Runner (Sekolah Nakal)
 * Launches scrape_all_14_channels.php in the background and writes progress to scraper.log
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$DATA_DIR = __DIR__ . '/data';
$LOG_FILE = $DATA_DIR . '/scraper.log';
$SCRIPT = __DIR__ . '/scrape_all_14_channels.php';

@mkdir($DATA_DIR, 0777, true);

// Action: check status/log
if (isset($_GET['status'])) {
    $logContent = file_exists($LOG_FILE) ? file_get_contents($LOG_FILE) : 'No log yet.';
    $moviesCount = 0;
    $moviesFile = $DATA_DIR . '/movies.json';
    if (file_exists($moviesFile)) {
        $arr = json_decode(file_get_contents($moviesFile), true);
        $moviesCount = is_array($arr) ? count($arr) : 0;
    }

    echo json_encode([
        'status' => 'running',
        'moviesInDatabase' => $moviesCount,
        'logSnippet' => substr($logContent, -3000),
        'lastUpdated' => date('c')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// Action: start background scraper
$cmd = "nohup php {$SCRIPT} > {$LOG_FILE} 2>&1 & echo $!";
$pid = shell_exec($cmd);

echo json_encode([
    'success' => true,
    'message' => 'Scraper batch 14 channels berhasil diluncurkan di background server!',
    'pid' => trim($pid ?: ''),
    'logFile' => $LOG_FILE,
    'statusUrl' => 'https://sekolahnakal.so791.com/api/run_scraper_bg.php?status=1'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
