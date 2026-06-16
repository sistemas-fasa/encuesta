<?php
/**
 * TEST - Verifica conexión a DB y sesión
 * Accede: /encuestas/api/test.php
 */
header('Content-Type: text/html; charset=utf-8');
echo "<h2>Diagnóstico Rápido</h2>";

echo "<h3>1. PHP</h3>";
echo "Versión: " . phpversion() . "<br>";

echo "<h3>2. Logger</h3>";
require_once __DIR__ . '/logger.php';
echo "LOG_DIR: " . LOG_DIR . "<br>";
echo "LOG_DIR existe: " . (is_dir(LOG_DIR) ? 'SI' : 'NO') . "<br>";
if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0755, true);
    echo "Intentando crear LOG_DIR: " . (is_dir(LOG_DIR) ? 'OK' : 'FALLÓ') . "<br>";
}
echo "LOG_DIR escribible: " . (is_writable(LOG_DIR) ? 'SI' : 'NO') . "<br>";

echo "<h3>3. Base de Datos</h3>";
try {
    $host = 'localhost';
    $db   = 'l0012413_encuest';
    $user = 'l0012413_encuest';
    $pass = 'SEvoba25pi';
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 3
    ]);
    echo "Conexión OK<br>";
    $stmt = $pdo->query("SELECT COUNT(*) as t FROM encuesta");
    $row = $stmt->fetch();
    echo "Encuestas: " . $row['t'] . "<br>";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
}

echo "<h3>4. Sesión</h3>";
session_start();
echo "Session ID: " . session_id() . "<br>";
$_SESSION['test'] = time();
echo "Session funciona: SI<br>";

echo "<h3>5. Config</h3>";
echo "error_log: " . ini_get('error_log') . "<br>";
echo "display_errors: " . ini_get('display_errors') . "<br>";

echo "<hr><p><b>Si todo esto funciona, el problema está en el frontend o la API.</b></p>";
