<?php
// upgrade.php
require 'config.php';

try {
    $pdo->exec("ALTER TABLE sorteos ADD COLUMN subtitulo VARCHAR(255) DEFAULT ''");
    echo "Columna 'subtitulo' agregada correctamente.<br>";
} catch (Exception $e) {
    echo "Aviso (subtitulo): " . $e->getMessage() . "<br>";
}

try {
    $pdo->exec("ALTER TABLE sorteos ADD COLUMN premios TEXT");
    echo "Columna 'premios' agregada correctamente.<br>";
} catch (Exception $e) {
    echo "Aviso (premios): " . $e->getMessage() . "<br>";
}

echo "<br><b>¡Base de datos actualizada! Ya puedes probar el sistema.</b>";
?>
