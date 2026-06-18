<?php
/**
 * Endpoint de versión para cache busting.
 * El frontend consulta este endpoint para verificar si debe recargar.
 * 
 * GET /encuestas/api/version.php
 */

header('Content-Type: application/json');
header("Cache-Control: no-cache, no-store, must-revalidate, private");
header("Pragma: no-cache");
header("Expires: 0");

// Versión basada en la fecha del último deploy + hash
$versionFile = __DIR__ . '/../../dist/version.json';
$version = [
    'version' => '__BUILD_VERSION__',
    'build_time' => date('Y-m-d H:i:s'),
    'commit' => ''
];

if (is_file($versionFile)) {
    $v = json_decode(file_get_contents($versionFile), true);
    if ($v) $version = array_merge($version, $v);
}

echo json_encode($version, JSON_UNESCAPED_UNICODE);
