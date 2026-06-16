<?php
require_once 'config.php';

try {
    echo "<h1>Diagnóstico de Base de Datos</h1>";
    
    // 1. Ver estructura de la tabla pregunta
    echo "<h2>Estructura de la tabla 'pregunta':</h2>";
    $stmt = $pdo->query("DESCRIBE pregunta");
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        foreach($row as $val) echo "<td>$val</td>";
        echo "</tr>";
    }
    echo "</table>";

    // 2. Ver las últimas 5 preguntas para ver si tienen datos en categoria
    echo "<h2>Últimas 5 preguntas:</h2>";
    $stmt = $pdo->query("SELECT id, texto_pregunta, categoria FROM pregunta ORDER BY id DESC LIMIT 5");
    echo "<pre>";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    echo "</pre>";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
