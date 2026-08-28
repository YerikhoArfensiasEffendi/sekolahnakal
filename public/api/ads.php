<?php
/**
 * Dynamic Ads API Endpoint (Sekolah Nakal)
 * GET /api/ads.php - Get current ad configurations
 * POST /api/ads.php - Save/update ad configurations
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataPath = __DIR__ . '/data/ads.json';
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$defaultAds = [
    'masterEnabled' => false,
    'slots' => [
        [
            'id' => 'left-1',
            'label' => 'Sayap Kiri - Slot 1 (Atas)',
            'position' => 'left',
            'enabled' => true,
            'type' => 'image',
            'mediaUrl' => '',
            'targetUrl' => 'https://discord.com/invite/serverbokep',
            'embedCode' => '',
            'altText' => 'Banner Sponsor Kiri 1'
        ],
        [
            'id' => 'left-2',
            'label' => 'Sayap Kiri - Slot 2 (Bawah)',
            'position' => 'left',
            'enabled' => true,
            'type' => 'image',
            'mediaUrl' => '',
            'targetUrl' => 'https://t.me/+O-QKy_uVG9E4NGY9',
            'embedCode' => '',
            'altText' => 'Banner Sponsor Kiri 2'
        ],
        [
            'id' => 'right-1',
            'label' => 'Sayap Kanan - Slot 1 (Atas)',
            'position' => 'right',
            'enabled' => true,
            'type' => 'image',
            'mediaUrl' => '',
            'targetUrl' => 'https://discord.com/invite/serverbokep',
            'embedCode' => '',
            'altText' => 'Banner Sponsor Kanan 1'
        ],
        [
            'id' => 'right-2',
            'label' => 'Sayap Kanan - Slot 2 (Bawah)',
            'position' => 'right',
            'enabled' => true,
            'type' => 'image',
            'mediaUrl' => '',
            'targetUrl' => 'https://t.me/+O-QKy_uVG9E4NGY9',
            'embedCode' => '',
            'altText' => 'Banner Sponsor Kanan 2'
        ]
    ],
    'updatedAt' => date('c')
];

function getAdsConfig($dataPath, $defaultAds) {
    if (file_exists($dataPath)) {
        $content = file_get_contents($dataPath);
        $json = json_decode($content, true);
        if (is_array($json) && isset($json['masterEnabled'])) {
            return $json;
        }
    }
    file_put_contents($dataPath, json_encode($defaultAds, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return $defaultAds;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $config = getAdsConfig($dataPath, $defaultAds);
    echo json_encode($config);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || !is_array($data) || !isset($data['masterEnabled'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ad config JSON']);
        exit;
    }

    if (isset($data['slots']) && is_array($data['slots'])) {
        $data['slots'] = array_map(function($slot) {
            return [
                'id' => htmlspecialchars(strip_tags((string)($slot['id'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'label' => htmlspecialchars(strip_tags((string)($slot['label'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'position' => in_array($slot['position'] ?? '', ['left', 'right']) ? $slot['position'] : 'left',
                'enabled' => !empty($slot['enabled']),
                'type' => in_array($slot['type'] ?? '', ['image', 'custom', 'embed']) ? $slot['type'] : 'image',
                'mediaUrl' => htmlspecialchars(strip_tags((string)($slot['mediaUrl'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'targetUrl' => htmlspecialchars(strip_tags((string)($slot['targetUrl'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'embedCode' => htmlspecialchars((string)($slot['embedCode'] ?? ''), ENT_QUOTES, 'UTF-8'),
                'altText' => htmlspecialchars(strip_tags((string)($slot['altText'] ?? '')), ENT_QUOTES, 'UTF-8')
            ];
        }, $data['slots']);
    }

    $data['updatedAt'] = date('c');
    file_put_contents($dataPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo json_encode(['success' => true, 'config' => $data]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
