<?php
require 'C:/Users/Pc/Documents/Encuestas/dist/api/config.php';

try {
    $sql = "SELECT s.*, c.nombre as camara_nombre FROM sorteo s JOIN camara c ON s.id_camara = c.id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    echo "Query OK. " . count($stmt->fetchAll()) . " rows.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
