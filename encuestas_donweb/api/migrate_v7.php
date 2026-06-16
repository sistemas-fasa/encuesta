<?php
// migrate_v7.php - Ejecutar para agregar columnas de color y siguiente_seccion_id a la tabla seccion
require_once __DIR__ . '/config.php';
echo "<pre>";
echo "🚀 Migración v7: Campos de color y siguiente sección en tabla seccion\n\n";

try {
    // 1. Agregar columna color
    $cols = $pdo->query("SHOW COLUMNS FROM seccion LIKE 'color'")->fetchAll();
    if (count($cols) === 0) {
        echo "1. Agregando columna color...\n";
        $pdo->exec("ALTER TABLE seccion ADD COLUMN color VARCHAR(50) DEFAULT '#94a3b8'");
        echo "   ✅ OK\n\n";
    } else {
        echo "1. ℹ️ Columna color ya existe\n\n";
    }
} catch (Exception $e) {
    echo "   ⚠️ " . $e->getMessage() . "\n\n";
}

try {
    // 2. Agregar columna siguiente_seccion_id
    $cols = $pdo->query("SHOW COLUMNS FROM seccion LIKE 'siguiente_seccion_id'")->fetchAll();
    if (count($cols) === 0) {
        echo "2. Agregando columna siguiente_seccion_id...\n";
        $pdo->exec("ALTER TABLE seccion ADD COLUMN siguiente_seccion_id INT NULL DEFAULT NULL");
        echo "   ✅ OK\n\n";
        
        echo "3. Agregando foreign key para siguiente_seccion_id...\n";
        $pdo->exec("ALTER TABLE seccion ADD CONSTRAINT fk_seccion_siguiente FOREIGN KEY (siguiente_seccion_id) REFERENCES seccion (id) ON DELETE SET NULL");
        echo "   ✅ OK\n\n";
    } else {
        echo "2. ℹ️ Columna siguiente_seccion_id ya existe\n\n";
    }
} catch (Exception $e) {
    echo "   ⚠️ " . $e->getMessage() . "\n\n";
}

echo "🎉 Migración v7 completada\n";
echo "⚠️ IMPORTANTE: Eliminá este archivo del servidor por seguridad después de ejecutarlo.\n";
echo "</pre>";
?>
