<?php
// backend/php/config.php

require_once __DIR__ . '/logger.php';

// ── Cache ──────────────────────────────────────────────────────────────
// Deshabilitar caché completamente en todas las respuestas de la API
header("Cache-Control: no-cache, no-store, must-revalidate, private");
header("Pragma: no-cache");
header("Expires: 0");

// ── PHP Error Handling ─────────────────────────────────────────────────
// No mostrar errores al usuario, solo registrarlos
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../logs/php_error.log');

// Manejador global de excepciones no capturadas
set_exception_handler(function ($exception) {
    survey_log_error('uncaught_exception', $exception);

    if (php_sapi_name() === 'cli') {
        echo "Error: " . $exception->getMessage() . "
";
        exit(1);
    }

    // Devolver JSON amigable
    if (!headers_sent()) {
        header('Content-Type: application/json', true, 500);
        header("Cache-Control: no-cache, no-store, must-revalidate, private");
        header("Pragma: no-cache");
        header("Expires: 0");
    }
    echo json_encode([
        'error'   => 'Ocurrió un error interno. Por favor intentá de nuevo.',
        'code'    => $exception->getCode()
    ]);
    exit;
});

// Manejador global de errores PHP (E_WARNING, E_NOTICE, etc.)
set_error_handler(function ($severity, $message, $file, $line) {
    // Convertir error a excepción (excluyendo @ suprimidos)
    if (!(error_reporting() & $severity)) {
        return false;
    }
    survey_log('php_error', [
        'severity' => $severity,
        'message'  => $message,
        'file'     => $file,
        'line'     => $line,
        'uri'      => $_SERVER['REQUEST_URI'] ?? ''
    ], 'ERROR');
    return false; // Dejar que PHP maneje el error normalmente
});

// Manejador de errores fatales (shutdown)
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        survey_log('fatal_error', [
            'message' => $error['message'],
            'file'    => $error['file'],
            'line'    => $error['line'],
            'uri'     => $_SERVER['REQUEST_URI'] ?? ''
        ], 'ERROR');

        if (!headers_sent()) {
            header('Content-Type: application/json', true, 500);
            header("Cache-Control: no-cache, no-store, must-revalidate, private");
            header("Pragma: no-cache");
            header("Expires: 0");
        }
        echo json_encode([
            'error' => 'Ocurrió un error inesperado. Por favor recargá la página e intentá de nuevo.'
        ]);
    }
});

// ── CORS ────────────────────────────────────────────────────────────────
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://camaralgsm.com.ar',
    'https://www.camaralgsm.com.ar',
    'https://cemisiones.com.ar',
    'https://www.cemisiones.com.ar'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// ── Database: runtime environment only ──────────────────────────────────
$dbHost = getenv('DB_HOST') ?: '';
$dbName = getenv('DB_NAME') ?: '';
$dbUser = getenv('DB_USER') ?: '';
$dbPass = getenv('DB_PASS') ?: '';

if ($dbHost === '' || $dbName === '' || $dbUser === '' || $dbPass === '') {
    error_log('Required database runtime variables are missing.');
    header('Content-Type: application/json', true, 503);
    echo json_encode(['error' => 'Service unavailable']);
    exit;
}

$dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbName);
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
} catch (\PDOException $error) {
    survey_log_error('db_connection', $error);
    header('Content-Type: application/json', true, 503);
    echo json_encode(['error' => 'Service unavailable']);
    exit;
}
if (!defined('ENCUESTAS_NO_SESSION')) {
    session_start();
}

function is_authenticated() {
    return isset($_SESSION['user']);
}

function send_json($data, $status = 200) {
    header('Content-Type: application/json', true, $status);
    header("Cache-Control: no-cache, no-store, must-revalidate, private");
    header("Pragma: no-cache");
    header("Expires: 0");
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
