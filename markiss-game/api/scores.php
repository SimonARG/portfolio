<?php
// Markiss Ringside high scores.
//
//   GET  /markiss-game/api/scores.php  -> {"scores": [top 10]}
//   POST /markiss-game/api/scores.php  {"initials":"ABC","points":123,"grade":"ok","accuracy":80}
//                                      -> {"ok":true,"id":..,"place":..,"scores":[top 10]}
//
// Connection settings live OUTSIDE the deploy slots, in
// /var/www/portfolio/shared/markiss-db.ini (see CLAUDE.md), so a deploy never
// touches them. Schema: migrations/2026-09-28-create-scores.sql.

declare(strict_types=1);

const MAX_POINTS = 64500;          // 37 cues x 1000 + full-combo bonus; mirrors the client
const TOP_N = 10;
const RATE_LIMIT = 6;              // submissions per IP ...
const RATE_WINDOW = '10 minutes';  // ... per this window

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function cfg(): array
{
    static $cfg = null;
    // MARKISS_DB_INI lets a smoke test point this script at a scratch DB.
    $path = getenv('MARKISS_DB_INI') ?: '/var/www/portfolio/shared/markiss-db.ini';
    return $cfg ??= (@parse_ini_file($path) ?: []);
}

function db(): PDO
{
    $cfg = cfg();
    if (empty($cfg['dsn'])) {
        reply(503, ['error' => 'scoreboard offline']);
    }
    try {
        return new PDO($cfg['dsn'], $cfg['user'] ?? 'markiss', $cfg['password'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3,
        ]);
    } catch (PDOException $e) {
        error_log('markiss scores: ' . $e->getMessage());
        reply(503, ['error' => 'scoreboard offline']);
    }
}

function top(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT id, initials, points, grade, accuracy, created_at::date AS day
           FROM scores ORDER BY points DESC, created_at ASC LIMIT ' . TOP_N
    )->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['points'] = (int) $r['points'];
        $r['accuracy'] = (int) $r['accuracy'];
    }
    return $rows;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    reply(200, ['scores' => top(db())]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    reply(405, ['error' => 'method not allowed']);
}

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 2048), true);
if (!is_array($in)) {
    reply(400, ['error' => 'bad json']);
}

$initials = strtoupper(trim((string) ($in['initials'] ?? '')));
$points   = $in['points'] ?? null;
$grade    = (string) ($in['grade'] ?? '');
$accuracy = $in['accuracy'] ?? null;

if (!preg_match('/^[A-Z0-9]{3}$/', $initials)
    || !is_int($points) || $points < 0 || $points > MAX_POINTS
    || !in_array($grade, ['try', 'ok', 'superb', 'perfect'], true)
    || !is_int($accuracy) || $accuracy < 0 || $accuracy > 100) {
    reply(422, ['error' => 'invalid score']);
}

// Behind Cloudflare REMOTE_ADDR is the edge, so prefer the visitor header.
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$pdo = db();
$ipHash = hash('sha256', (cfg()['salt'] ?? '') . '|' . $ip);

$recent = $pdo->prepare("SELECT count(*) FROM scores WHERE ip_hash = ? AND created_at > now() - interval '" . RATE_WINDOW . "'");
$recent->execute([$ipHash]);
if ((int) $recent->fetchColumn() >= RATE_LIMIT) {
    reply(429, ['error' => 'too many scores, take a breather']);
}

$ins = $pdo->prepare('INSERT INTO scores (initials, points, grade, accuracy, ip_hash) VALUES (?, ?, ?, ?, ?) RETURNING id, created_at');
$ins->execute([$initials, $points, $grade, $accuracy, $ipHash]);
$row = $ins->fetch();

$place = $pdo->prepare('SELECT count(*) + 1 FROM scores WHERE points > ? OR (points = ? AND created_at < ?)');
$place->execute([$points, $points, $row['created_at']]);

reply(201, [
    'ok' => true,
    'id' => (int) $row['id'],
    'place' => (int) $place->fetchColumn(),
    'scores' => top($pdo),
]);
