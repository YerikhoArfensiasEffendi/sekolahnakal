<?php
/**
 * ZeroStorage.net Cloud Integration API Proxy
 * Official Sekolah Nakal Storage Backend
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configFile = __DIR__ . '/data/config.json';
$defaultKey = 'sk_WLh9zdZcVOf3GA7L_MFbS_IPMqzz7Iv3';

function getConfig() {
    global $configFile, $defaultKey;
    if (file_exists($configFile)) {
        $content = file_get_contents($configFile);
        $data = json_decode($content, true);
        if (is_array($data)) {
            return $data;
        }
    }
    return ['zerostorage_api_key' => $defaultKey];
}

function saveConfig($data) {
    global $configFile;
    $dir = dirname($configFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents($configFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

$action = $_GET['action'] ?? 'upload';

// 1. Get ZeroStorage Config
if ($action === 'get_config') {
    $cfg = getConfig();
    echo json_encode([
        'success' => true,
        'hasApiKey' => !empty($cfg['zerostorage_api_key'] ?? ''),
        'apiKey' => $cfg['zerostorage_api_key'] ?? $defaultKey,
        'storage_provider' => $cfg['storage_provider'] ?? 'zerostorage'
    ]);
    exit;
}

// 2. Save ZeroStorage Config
if ($action === 'save_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $cfg = getConfig();
    if (isset($input['apiKey'])) {
        $cfg['zerostorage_api_key'] = trim($input['apiKey']);
    }
    if (isset($input['storage_provider'])) {
        $cfg['storage_provider'] = trim($input['storage_provider']);
    }
    saveConfig($cfg);
    echo json_encode(['success' => true, 'message' => 'Konfigurasi ZeroStorage berhasil disimpan.']);
    exit;
}

// 3. Upload Video to ZeroStorage.net
if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $file = $_FILES['video'] ?? ($_FILES['file'] ?? null);
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'File video tidak ditemukan atau gagal diunggah.', 'code' => $file['error'] ?? -1]);
        exit;
    }

    $cfg = getConfig();
    $apiKey = !empty($_POST['apiKey']) ? trim($_POST['apiKey']) : ($cfg['zerostorage_api_key'] ?? $defaultKey);

    $tmpPath = $file['tmp_name'];
    $fileName = $file['name'];
    $fileMime = mime_content_type($tmpPath) ?: 'video/mp4';

    $uploadUrl = 'https://upload.zerostorage.net/api/upload/universal';
    $cfile = new CURLFile($tmpPath, $fileMime, $fileName);

    $postData = [
        'file' => $cfile,
        'title' => pathinfo($fileName, PATHINFO_FILENAME)
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uploadUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 900); // 15 menit untuk video besar
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $response) {
        $resData = json_decode($response, true);
        if (!empty($resData['success']) && (!empty($resData['embedUrl']) || !empty($resData['fileId']))) {
            $embedUrl = $resData['embedUrl'] ?? ('https://zerostorage.net/embed/' . $resData['fileId']);
            echo json_encode([
                'success' => true,
                'url' => $embedUrl,
                'embedUrl' => $embedUrl,
                'fileId' => $resData['fileId'] ?? '',
                'viewUrl' => $resData['viewUrl'] ?? '',
                'storage' => 'zerostorage'
            ]);
            exit;
        }
    }

    $errMsg = 'Gagal mengunggah ke ZeroStorage (HTTP ' . $httpCode . '). ';
    if ($response) {
        $resData = json_decode($response, true);
        if (!empty($resData['error'])) {
            $errMsg .= $resData['error'];
        } elseif (!empty($resData['message'])) {
            $errMsg .= $resData['message'];
        } else {
            $errMsg .= ($curlError ?: 'Respons server tidak valid.');
        }
    } else {
        $errMsg .= ($curlError ?: 'Tidak ada respons dari server.');
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $errMsg,
        'raw' => $response
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Aksi tidak dikenali.']);
