<?php
require_once __DIR__ . '/api/config.php';
\ = \->query("SELECT id, titulo, orden, sector_id, siguiente_seccion_id FROM seccion ORDER BY orden");
\ = \->fetchAll(PDO::FETCH_ASSOC);

\ = \->query("SELECT o.id, o.pregunta_id, o.texto, o.siguiente_seccion_id, p.texto_pregunta, p.seccion_id FROM opcion o JOIN pregunta p ON o.pregunta_id = p.id WHERE o.siguiente_seccion_id IS NOT NULL");
\ = \->fetchAll(PDO::FETCH_ASSOC);

file_put_contents('debug_survey.json', json_encode(['secciones' => \, 'saltos' => \], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
