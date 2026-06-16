<?php
// migrate_v6.php - Reutilización de preguntas (Muchos a Muchos)
require_once __DIR__ . '/config.php';
echo "<pre>";
echo "🚀 Migración v6: Relación Muchos-a-Muchos\n\n";

try {
    echo "1. Creando tabla encuesta_pregunta...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS encuesta_pregunta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        encuesta_id INT NOT NULL,
        pregunta_id INT NOT NULL,
        seccion_id INT NULL,
        orden INT DEFAULT 0,
        UNIQUE(encuesta_id, pregunta_id),
        FOREIGN KEY (encuesta_id) REFERENCES encuesta(id) ON DELETE CASCADE,
        FOREIGN KEY (pregunta_id) REFERENCES pregunta(id) ON DELETE CASCADE
    )");
    echo "   ✅ OK\n\n";

    echo "2. Migrando vínculos existentes...\n";
    $pdo->exec("INSERT IGNORE INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden)
                SELECT encuesta_id, id, seccion_id, orden 
                FROM pregunta 
                WHERE encuesta_id IS NOT NULL");
    echo "   ✅ OK\n\n";

} catch (Exception $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\n🎉 Fin de migración. ELIMINÁ ESTE ARCHIVO.\n";
echo "</pre>";
?>
