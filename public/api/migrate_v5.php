<?php
// migrate_v5.php - Ejecutar UNA SOLA VEZ en producción para agregar soporte de banco de preguntas
// Subir este archivo al servidor y acceder desde el navegador, luego ELIMINARLO

require_once __DIR__ . '/config.php';

echo "<pre>";
echo "🚀 Migración v5: Banco de Preguntas\n\n";

try {
    // 1. Hacer encuesta_id nullable
    echo "1. Haciendo encuesta_id nullable en pregunta...\n";
    $pdo->exec("ALTER TABLE pregunta MODIFY COLUMN encuesta_id INT NULL");
    echo "   ✅ OK\n\n";
} catch (Exception $e) {
    echo "   ⚠️ " . $e->getMessage() . "\n\n";
}

try {
    // 2. Agregar columna categoria
    $cols = $pdo->query("SHOW COLUMNS FROM pregunta LIKE 'categoria'")->fetchAll();
    if (count($cols) === 0) {
        echo "2. Agregando columna categoria...\n";
        $pdo->exec("ALTER TABLE pregunta ADD COLUMN categoria VARCHAR(100) NULL DEFAULT NULL");
        echo "   ✅ OK\n\n";
    } else {
        echo "2. ℹ️ Columna categoria ya existe\n\n";
    }
} catch (Exception $e) {
    echo "   ⚠️ " . $e->getMessage() . "\n\n";
}

echo "🎉 Migración v5 completada\n";
echo "⚠️ IMPORTANTE: Eliminá este archivo del servidor por seguridad.\n";
echo "</pre>";
?>
