<?php
require_once __DIR__ . '/db.php';
$stmt = $pdo->query("SELECT id, texto_pregunta FROM pregunta");
$questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents(__DIR__ . '/questions_dump.json', json_encode($questions));
echo "Done";
