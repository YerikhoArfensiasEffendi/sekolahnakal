<?php
/**
 * Lulustream Direct Integration API (Sekolah Nakal)
 * Handles:
 * 1. GET /api/lulustream.php?action=get_config -> Get saved API key
 * 2. POST /api/lulustream.php?action=save_config -> Save API key
 * 3. POST /api/lulustream.php?action=upload -> Upload video file directly to Lulustream
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configPath = __DIR__ . '/data/config.json';
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

function getConfig($configPath) {
    if (file_exists($configPath)) {
        $content = file_get_contents($configPath);
        $json = json_decode($content, true);
        if (is_array($json)) {
            return $json;
        }
    }
    return ['lulustream_api_key' => ''];
}

function saveConfig($configPath, $data) {
    return file_put_contents($configPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

$action = $_GET['action'] ?? 'get_config';

// 1. Get configuration
if ($action === 'get_config') {
    $config = getConfig($configPath);
    // Mask key slightly for safety
    $key = $config['lulustream_api_key'] ?? '';
    echo json_encode([
        'success' => true,
        'hasApiKey' => !empty($key),
        'apiKey' => $key
    ]);
    exit;
}

// 2. Save configuration
if ($action === 'save_config') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    $apiKey = trim($data['apiKey'] ?? '');

    $config = getConfig($configPath);
    $config['lulustream_api_key'] = $apiKey;
    saveConfig($configPath, $config);

    echo json_encode([
        'success' => true,
        'message' => 'Lulustream API Key berhasil disimpan.',
        'hasApiKey' => !empty($apiKey)
    ]);
    exit;
}

// 3. Upload file directly to Lulustream
if ($action === 'upload') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $config = getConfig($configPath);
    $apiKey = trim($_POST['apiKey'] ?? ($config['lulustream_api_key'] ?? ''));

    if (empty($apiKey)) {
        http_response_code(400);
        echo json_encode(['error' => 'Lulustream API Key belum disetting.']);
        exit;
    }

    $fileField = isset($_FILES['video']) ? 'video' : (isset($_FILES['file']) ? 'file' : null);
    if (!$fileField || $_FILES[$fileField]['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'File video tidak ditemukan atau gagal diunggah ke server.']);
        exit;
    }

    $file = $_FILES[$fileField];
    $tmpPath = $file['tmp_name'];
    $fileName = $file['name'];

    $serverUrl = "https://api.lulustream.com/api/upload/server?key=" . urlencode($apiKey);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $serverUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        // Fallback domain luluvdo.com
        $serverUrl = "https://luluvdo.com/api/upload/server?key=" . urlencode($apiKey);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $serverUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        $response = curl_exec($ch);
        curl_close($ch);
    }

    $serverData = json_decode($response, true);
    $uploadTarget = $serverData['result'] ?? null;

    if (!$uploadTarget) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Gagal mendapatkan server upload dari Lulustream. Periksa kembali API Key Anda.',
            'raw' => $response
        ]);
        exit;
    }

    // Step B: Send file to Lulustream upload server
    $cfile = curl_file_create($tmpPath, mime_content_type($tmpPath) ?: 'video/mp4', $fileName);
    $postData = [
        'api_key' => $apiKey,
        'file' => $cfile
    ];

    $chUpload = curl_init();
    curl_setopt($chUpload, CURLOPT_URL, $uploadTarget);
    curl_setopt($chUpload, CURLOPT_POST, true);
    curl_setopt($chUpload, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($chUpload, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chUpload, CURLOPT_TIMEOUT, 600); // 10 minutes for large videos
    curl_setopt($chUpload, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($chUpload, CURLOPT_SSL_VERIFYHOST, 2);
    $uploadRes = curl_exec($chUpload);
    $uploadCode = curl_getinfo($chUpload, CURLINFO_HTTP_CODE);
    curl_close($chUpload);

    $jsonRes = json_decode($uploadRes, true);
    $fileCode = null;

    if (is_array($jsonRes) && isset($jsonRes[0]['file_code'])) {
        $fileCode = $jsonRes[0]['file_code'];
    } elseif (is_array($jsonRes) && isset($jsonRes['files'][0]['file_code'])) {
        $fileCode = $jsonRes['files'][0]['file_code'];
    }

    if ($fileCode) {
        $streamUrl = "https://luluvdo.com/e/" . $fileCode;
        echo json_encode([
            'success' => true,
            'fileCode' => $fileCode,
            'url' => $streamUrl,
            'embedUrl' => $streamUrl,
            'fileName' => $fileName,
            'storage' => 'lulustream'
        ]);
        exit;
    }

    http_response_code(500);
    echo json_encode([
        'error' => 'Upload ke Lulustream gagal diproses.',
        'raw' => $uploadRes
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Aksi tidak valid.']);
