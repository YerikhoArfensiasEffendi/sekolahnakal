<?php
/**
 * Categories API Endpoint (Sekolah Nakal)
 * GET /api/categories.php - List all categories
 * POST /api/categories.php - Save/update category list
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataPath = __DIR__ . '/data/categories.json';
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

$defaultCategories = [
    ['id' => 'cat-1', 'name' => 'Romance & Sensual', 'slug' => 'romance-sensual', 'description' => 'Romantisme sensual dengan alur cerita mendalam.'],
    ['id' => 'cat-2', 'name' => 'Cosplay & Roleplay', 'slug' => 'cosplay-roleplay', 'description' => 'Kostum anime, maid, suster, dan roleplay bertema.'],
    ['id' => 'cat-3', 'name' => 'Asian & JAV Style', 'slug' => 'asian-jav-style', 'description' => 'Gaya sinematik Asia & JAV dengan talent terpopuler.'],
    ['id' => 'cat-4', 'name' => 'POV Immersive', 'slug' => 'pov-immersive', 'description' => 'Sudut pandang orang pertama yang terasa nyata.'],
    ['id' => 'cat-5', 'name' => 'Uncensored Cut', 'slug' => 'uncensored-cut', 'description' => 'Koleksi master original tanpa sensor kualitas Ultra HD.'],
    ['id' => 'cat-6', 'name' => 'Student & Teacher', 'slug' => 'student-teacher', 'description' => 'Kisah rahasia ruang bimbingan dan sepulang sekolah.'],
    ['id' => 'cat-7', 'name' => 'Office Affair', 'slug' => 'office-affair', 'description' => 'Drama lembur kantor dan skandal sekretaris pribadi.'],
    ['id' => 'cat-8', 'name' => 'Late Night Affair', 'slug' => 'late-night-affair', 'description' => 'Pertemuan privat larut malam di apartemen mewah.'],
    ['id' => 'cat-9', 'name' => 'Outdoor & Public', 'slug' => 'outdoor-public', 'description' => 'Aksi menantang dan mendebarkan di area terbuka.'],
    ['id' => 'cat-10', 'name' => 'VR & 4K Ultra', 'slug' => 'vr-4k-ultra', 'description' => 'Resolusi tertinggi 4K dan kompatibilitas headset VR.'],
    ['id' => 'cat-11', 'name' => 'Talent Verified Collab', 'slug' => 'talent-verified-collab', 'description' => 'Kolaborasi resmi kreator dan talent verified.'],
    ['id' => 'cat-12', 'name' => 'Exclusive Premiere', 'slug' => 'exclusive-premiere', 'description' => 'Rilisan perdana seri eksklusif Sekolah Nakal.']
];

function getCategories($dataPath, $defaultCategories = []) {
    if (file_exists($dataPath)) {
        $content = file_get_contents($dataPath);
        $json = json_decode($content, true);
        if (is_array($json)) {
            return $json;
        }
    }
    file_put_contents($dataPath, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return [];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $categories = getCategories($dataPath, $defaultCategories);
    echo json_encode($categories);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    if (isset($data['categories']) && is_array($data['categories'])) {
        $sanitizedCats = array_map(function($c) {
            return [
                'id' => htmlspecialchars(strip_tags((string)($c['id'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'name' => htmlspecialchars(strip_tags((string)($c['name'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'slug' => htmlspecialchars(strip_tags((string)($c['slug'] ?? '')), ENT_QUOTES, 'UTF-8'),
                'description' => htmlspecialchars(strip_tags((string)($c['description'] ?? '')), ENT_QUOTES, 'UTF-8')
            ];
        }, $data['categories']);
        file_put_contents($dataPath, json_encode($sanitizedCats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
        echo json_encode(['success' => true, 'categories' => $sanitizedCats]);
        exit;
    }

    $categories = getCategories($dataPath, $defaultCategories);
    if (isset($data['name'])) {
        $id = htmlspecialchars(strip_tags((string)($data['id'] ?? ('cat-' . time()))), ENT_QUOTES, 'UTF-8');
        $cleanName = htmlspecialchars(strip_tags((string)$data['name']), ENT_QUOTES, 'UTF-8');
        $slug = $data['slug'] ?? strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $cleanName), '-'));
        $newCat = [
            'id' => $id,
            'name' => $cleanName,
            'slug' => htmlspecialchars(strip_tags((string)$slug), ENT_QUOTES, 'UTF-8'),
            'description' => htmlspecialchars(strip_tags((string)($data['description'] ?? '')), ENT_QUOTES, 'UTF-8')
        ];
        $categories[] = $newCat;
        file_put_contents($dataPath, json_encode($categories, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
        echo json_encode(['success' => true, 'category' => $newCat]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
