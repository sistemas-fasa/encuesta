<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = 'l0012413_encuest' AND REFERENCED_TABLE_NAME = 'pregunta';");
    echo "<h3>Foreign keys referencing 'pregunta'</h3>";
    echo "<pre>"; print_r($stmt->fetchAll(PDO::FETCH_ASSOC)); echo "</pre>";

    $stmt2 = $pdo->query("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = 'l0012413_encuest' AND TABLE_NAME = 'pregunta';");
    echo "<h3>Foreign keys ON 'pregunta'</h3>";
    echo "<pre>"; print_r($stmt2->fetchAll(PDO::FETCH_ASSOC)); echo "</pre>";

    $stmt3 = $pdo->query("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = 'l0012413_encuest' AND TABLE_NAME = 'encuesta_pregunta';");
    echo "<h3>Foreign keys ON 'encuesta_pregunta'</h3>";
    echo "<pre>"; print_r($stmt3->fetchAll(PDO::FETCH_ASSOC)); echo "</pre>";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
