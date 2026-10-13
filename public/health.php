<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

try {
    define('ENCUESTAS_NO_SESSION', true);
    require_once __DIR__ . '/api/config.php';
    $pdo->query('SELECT 1');

    $version = 'unknown';
    $versionPath = __DIR__ . '/../dist/version.json';
    if (is_file($versionPath)) {
        $versionData = json_decode(file_get_contents($versionPath), true);
        if (is_array($versionData) && isset($versionData['version'])) {
            $version = (string) $versionData['version'];
        }
    }

    echo json_encode([
        'status' => 'ok',
        'service' => 'encuestas-fasa',
        'database' => 'ok',
        'version' => $version,
        'time' => gmdate(DATE_ATOM),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(503);
    error_log('Encuestas health check failed.');
    echo json_encode([
        'status' => 'error',
        'service' => 'encuestas-fasa',
        'database' => 'error',
        'error' => 'Service unavailable',
        'time' => gmdate(DATE_ATOM),
    ], JSON_UNESCAPED_UNICODE);
}
