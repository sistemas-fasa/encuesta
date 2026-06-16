<?php
require_once __DIR__ . '/config.php';

echo "Iniciando migración de tablas para Importación...<br>";

try {
    // 1. Crear tabla de historial de importaciones
    $pdo->exec("CREATE TABLE IF NOT EXISTS import_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status ENUM('pendiente', 'procesando', 'completado', 'error') DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL
    )");
    echo "Tabla import_history OK.<br>";

    // 2. Crear tabla temporal de datos
    $pdo->exec("CREATE TABLE IF NOT EXISTS temp_import_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        import_id INT,
        raw_data LONGTEXT,
        status ENUM('pendiente', 'procesado', 'error') DEFAULT 'pendiente',
        error_log TEXT NULL,
        FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE
    )");
    echo "Tabla temp_import_data OK.<br>";

    echo "<b>Migración finalizada con éxito.</b>";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
