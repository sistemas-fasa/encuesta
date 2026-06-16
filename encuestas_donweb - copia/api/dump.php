<?php require_once db.php; echo json_encode(->query(SELECT id, texto_pregunta, tipo, seccion_id FROM pregunta)->fetchAll(PDO::FETCH_ASSOC)); ?>
