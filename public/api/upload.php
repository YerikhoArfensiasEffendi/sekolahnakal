<?php
/**
 * Direct Video & Media Upload API (Sekolah Nakal)
 * POST /api/upload.php
 * Handles: video file upload, poster image upload
 * Returns: JSON with public URL
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

$baseUploadDir = dirname(__DIR__) . '/uploads';
$videosDir = $baseUploadDir . '/videos';
$postersDir = $baseUploadDir . '/posters';

if (!file_exists($videosDir)) {
    mkdir($videosDir, 0755, true);
}
if (!file_exists($postersDir)) {
    mkdir($postersDir, 0755, true);
}

// 1. Check for video upload
$fileField = null;
if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
    $fileField = 'video';
} elseif (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileField = 'file';
} elseif (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
    $fileField = 'poster';
}

if (!$fileField) {
    $errorCode = isset($_FILES['video']) ? $_FILES['video']['error'] : (isset($_FILES['file']) ? $_FILES['file']['error'] : 4);
    $errorMessages = [
        1 => 'Ukuran file melebihi upload_max_filesize di server',
        2 => 'Ukuran file melebihi MAX_FILE_SIZE di form',
        3 => 'File hanya terunggah sebagian',
        4 => 'Tidak ada file yang diunggah',
        6 => 'Folder temporary server tidak ditemukan',
        7 => 'Gagal menulis file ke disk server',
        8 => 'Ekstensi PHP menghentikan upload file'
    ];

    http_response_code(400);
    echo json_encode([
        'error' => $errorMessages[$errorCode] ?? 'Tidak ada file yang diunggah atau upload gagal.',
        'errorCode' => $errorCode
    ]);
    exit;
}

$uploadedFile = $_FILES[$fileField];
$origName = basename($uploadedFile['name']);
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

// Supported video/image extensions (SVG excluded for XSS safety)
$allowedVideoExts = ['mp4', 'webm', 'mkv', 'mov', 'm4v', 'ts'];
$allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($ext, $allowedVideoExts) && !in_array($ext, $allowedImageExts)) {
    http_response_code(415);
    echo json_encode(['error' => 'Format file tidak didukung. Harap upload video (.mp4, .webm, .mkv, .mov) atau poster (.jpg, .png, .webp).']);
    exit;
}

// Binary MIME Type Inspection via finfo
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $uploadedFile['tmp_name']);
    finfo_close($finfo);

    $validMimes = [
        'video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime', 'video/mp2t', 'video/x-m4v', 'video/mpeg', 'application/octet-stream',
        'image/jpeg', 'image/png', 'image/webp'
    ];

    // Reject dangerous executable and script MIME types
    $dangerousMimes = ['text/php', 'application/x-httpd-php', 'application/x-php', 'text/html', 'text/javascript', 'application/javascript', 'text/xml', 'image/svg+xml'];
    if (in_array($detectedMime, $dangerousMimes)) {
        http_response_code(403);
        echo json_encode(['error' => 'File ditolak demi keamanan server (Tipe konten tidak diizinkan).']);
        exit;
    }
}

$isPoster = ($fileField === 'poster') || in_array($ext, $allowedImageExts);
$targetDir = $isPoster ? $postersDir : $videosDir;
$publicPrefix = $isPoster ? '/uploads/posters/' : '/uploads/videos/';

// Generate clean unique filename
$cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$uniqueName = 'sn_' . ($isPoster ? 'img_' : 'vid_') . time() . '_' . substr(md5(uniqid()), 0, 6) . '.' . ($ext ?: 'mp4');
$targetPath = $targetDir . '/' . $uniqueName;

if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
    @chmod($targetPath, 0644);
    $publicUrl = $publicPrefix . $uniqueName;

    echo json_encode([
        'success' => true,
        'url' => $publicUrl,
        'filename' => $uniqueName,
        'originalName' => htmlspecialchars($origName, ENT_QUOTES, 'UTF-8'),
        'size' => $uploadedFile['size'],
        'type' => $isPoster ? 'image' : 'video'
    ]);
    exit;
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Gagal memindahkan file ke direktori uploads server.'
    ]);
    exit;
}
