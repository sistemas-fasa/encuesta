<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
try {
    $pdo->exec("ALTER TABLE pregunta ADD COLUMN estilo TEXT DEFAULT 'auto'");
    echo "Columna estilo agregada.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'duplicate column name') !== false) {
        echo "La columna ya existe.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
