<?php
$pdo = new PDO('sqlite:backend/database.sqlite');
$stmt = $pdo->query('PRAGMA table_info(pregunta)');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
