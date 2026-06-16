<?php
require_once 'config.php';

try {
    // Asegurarnos que existan ambas columnas para evitar errores
    $stmt = $pdo->query("SHOW COLUMNS FROM pregunta LIKE 'categoria'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE pregunta ADD COLUMN categoria VARCHAR(255) DEFAULT NULL");
        echo "Columna 'categoria' creada.<br>";
    } else {
        echo "Columna 'categoria' ya existe.<br>";
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM pregunta LIKE 'rubro'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE pregunta ADD COLUMN rubro VARCHAR(255) DEFAULT NULL");
        echo "Columna 'rubro' creada.<br>";
    } else {
        echo "Columna 'rubro' ya existe.<br>";
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM seccion LIKE 'sector_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE seccion ADD COLUMN sector_id INT DEFAULT NULL");
        echo "Columna 'sector_id' creada en tabla 'seccion'.<br>";
    }

    echo "<b>Proceso finalizado correctamente.</b>";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
