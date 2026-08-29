<?php
/**
 * Movies API Endpoint (Sekolah Nakal)
 * GET /api/movies.php - List all movies
 * POST /api/movies.php - Add or update movie
 * DELETE /api/movies.php?id=xxx - Delete movie
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataPath = __DIR__ . '/data/movies.json';
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Default starter catalog if file doesn't exist
$defaultMovies = [
    [
        'id' => 'sn-101',
        'title' => 'Secret Classroom: Late Night Session Vol. 1',
        'slug' => 'secret-classroom-late-night-session-vol-1',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 124,
        'rating' => 9.4,
        'genres' => ['Student & Teacher', 'Romance & Sensual'],
        'tier' => 'regular',
        'overview' => 'Pertemuan rahasia sepulang jam pelajaran di ruang bimbingan konseling yang sunyi.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    ],
    [
        'id' => 'sn-102',
        'title' => 'Private Office: The CEO Extravaganza',
        'slug' => 'private-office-the-ceo-extravaganza',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 118,
        'rating' => 9.7,
        'genres' => ['Office Affair', 'Romance & Sensual'],
        'tier' => 'regular',
        'overview' => 'Lembur larut malam di lantai 42 gedung perkantoran mewah bersama sekretaris pribadi.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ],
    [
        'id' => 'sn-103',
        'title' => 'Cosplay Fantasy: Maid in Secret Chamber',
        'slug' => 'cosplay-fantasy-maid-in-secret-chamber',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 105,
        'rating' => 9.6,
        'genres' => ['Cosplay & Roleplay', 'Asian & JAV Style'],
        'tier' => 'regular',
        'overview' => 'Pelayan pribadi dengan kostum maid seksi melayani tuan muda di ruang rahasia bertema anime.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    ],
    [
        'id' => 'sn-104',
        'title' => 'Tokyo Night Life: Roppongi Secret Lounge',
        'slug' => 'tokyo-night-life-roppongi-secret-lounge',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 132,
        'rating' => 9.8,
        'genres' => ['Asian & JAV Style', 'Late Night Affair'],
        'tier' => 'vip',
        'overview' => 'Kisah gemerlap malam Tokyo di lounge privat tersembunyi dengan talent idola ternama.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    ],
    [
        'id' => 'sn-105',
        'title' => 'Master Uncut: The Penthouse Sensation VVIP',
        'slug' => 'master-uncut-the-penthouse-sensation-vvip',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 145,
        'rating' => 9.9,
        'genres' => ['Uncensored Cut', 'Romance & Sensual'],
        'tier' => 'vvip',
        'overview' => 'Edisi master uncut tanpa sensor di penthouse mewah dengan sinematografi 4K Ultra HD.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    ],
    [
        'id' => 'sn-106',
        'title' => 'Talent Collab Vol. 1: Sweet Escape in Bali Villa',
        'slug' => 'talent-collab-vol-1-sweet-escape-in-bali-villa',
        'posterUrl' => '/images/logo_v2.png',
        'backdropUrl' => '/images/logo_v2.png',
        'year' => 2026,
        'duration' => 98,
        'rating' => 9.5,
        'genres' => ['Talent Verified Collab', 'POV Immersive'],
        'tier' => 'talent',
        'overview' => 'Kencan romantis dan sensual di villa privat Seminyak Bali bersama talent verified.',
        'videoUrl' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
    ]
];

function getMovies($dataPath, $defaultMovies = []) {
    if (file_exists($dataPath)) {
        $content = file_get_contents($dataPath);
        $json = json_decode($content, true);
        if (is_array($json)) {
            $sanitized = [];
            foreach ($json as $m) {
                if (isset($m['videoUrl']) && strpos($m['videoUrl'], '/uploads/videos/') === 0) {
                    $localFilePath = dirname(__DIR__) . $m['videoUrl'];
                    if (!file_exists($localFilePath)) {
                        $m['videoUrl'] = '';
                    }
                }
                if (isset($m['posterUrl']) && strpos($m['posterUrl'], '/uploads/posters/') === 0) {
                    $localFilePath = dirname(__DIR__) . $m['posterUrl'];
                    if (!file_exists($localFilePath)) {
                        $m['posterUrl'] = '/images/logo_v2.png';
                    }
                }
                $sanitized[] = $m;
            }
            return $sanitized;
        }
    }
    file_put_contents($dataPath, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return [];
}

function saveMoviesList($dataPath, $movies) {
    return file_put_contents($dataPath, json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;
    $movies = getMovies($dataPath, $defaultMovies);
    
    if ($id) {
        foreach ($movies as $m) {
            if ($m['id'] === $id) {
                echo json_encode($m);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Movie not found']);
        exit;
    }

    echo json_encode($movies);
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

    $movies = getMovies($dataPath, $defaultMovies);

    // If direct array of movies or bulk replace
    if (isset($data['bulk']) && is_array($data['bulk'])) {
        saveMoviesList($dataPath, $data['bulk']);
        echo json_encode(['success' => true, 'count' => count($data['bulk'])]);
        exit;
    }
    if (is_array($data) && (empty($data) || isset($data[0]))) {
        saveMoviesList($dataPath, $data);
        echo json_encode(['success' => true, 'count' => count($data)]);
        exit;
    }

    // Single item add or update
    $id = isset($data['id']) && !empty($data['id']) ? (string)$data['id'] : (string)(time() . rand(100, 999));
    $data['id'] = $id;

    // XSS Sanitization
    if (isset($data['title'])) {
        $data['title'] = htmlspecialchars(strip_tags((string)$data['title']), ENT_QUOTES, 'UTF-8');
    }
    if (isset($data['overview'])) {
        $data['overview'] = htmlspecialchars(strip_tags((string)$data['overview']), ENT_QUOTES, 'UTF-8');
    }
    if (isset($data['genres']) && is_array($data['genres'])) {
        $data['genres'] = array_values(array_map(function($g) {
            return htmlspecialchars(strip_tags((string)$g), ENT_QUOTES, 'UTF-8');
        }, $data['genres']));
    }

    if (!isset($data['slug']) || empty($data['slug'])) {
        $data['slug'] = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title'] ?? 'video'), '-'));
    }

    $existingIndex = -1;
    foreach ($movies as $idx => $m) {
        if ($m['id'] === $id) {
            $existingIndex = $idx;
            break;
        }
    }

    if ($existingIndex >= 0) {
        $movies[$existingIndex] = array_merge($movies[$existingIndex], $data);
    } else {
        array_unshift($movies, $data);
    }

    saveMoviesList($dataPath, $movies);
    echo json_encode(['success' => true, 'movie' => $data]);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : null;
    if (!$id) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $id = $data['id'] ?? null;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Movie ID required for delete']);
        exit;
    }

    $movies = getMovies($dataPath, $defaultMovies);
    $filtered = [];
    $deletedMovie = null;

    foreach ($movies as $m) {
        if ($m['id'] === $id) {
            $deletedMovie = $m;
        } else {
            $filtered[] = $m;
        }
    }

    if ($deletedMovie) {
        // Optional: delete associated video file if it's local in /uploads/videos/
        if (isset($deletedMovie['videoUrl']) && strpos($deletedMovie['videoUrl'], '/uploads/videos/') !== false) {
            $videoFile = dirname(__DIR__) . $deletedMovie['videoUrl'];
            if (file_exists($videoFile)) {
                @unlink($videoFile);
            }
        }

        saveMoviesList($dataPath, $filtered);
        echo json_encode(['success' => true, 'deletedId' => $id]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Movie not found']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
