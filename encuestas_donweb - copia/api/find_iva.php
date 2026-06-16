<?php
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');
echo "<html><head><title>Buscador de Pregunta IVA</title>";
echo "<style>body{font-family:sans-serif;padding:2rem;background:#f1f5f9;} table{border-collapse:collapse;width:100%;margin-bottom:2rem;} th,td{border:1px solid #cbd5e1;padding:0.5rem 1rem;text-align:left;font-size:0.85rem;} th{background:#1e293b;color:white;} tr:nth-child(even){background:#f8fafc;} h2{color:#0ea5e9;margin-top:2rem;} .ok{color:green;font-weight:bold;} .no{color:red;font-weight:bold;}</style>";
echo "</head><body>";
echo "<h1>Diagnóstico: Pregunta IVA en la base de datos</h1>";

try {
    // 1. Todas las preguntas
    echo "<h2>1. Todas las preguntas del sistema</h2>";
    $stmt = $pdo->query("SELECT id, texto_pregunta, tipo, seccion_id FROM pregunta ORDER BY id");
    $preguntas = $stmt->fetchAll();
    echo "<table><tr><th>ID</th><th>Texto</th><th>Tipo</th><th>Seccion</th><th>¿Tiene 'IVA'?</th></tr>";
    foreach ($preguntas as $p) {
        $tieneIva = (stripos($p['texto_pregunta'], 'IVA') !== false || stripos($p['texto_pregunta'], 'I.V.A') !== false);
        echo "<tr>";
        echo "<td>{$p['id']}</td>";
        echo "<td>" . htmlspecialchars($p['texto_pregunta']) . "</td>";
        echo "<td>{$p['tipo']}</td>";
        echo "<td>{$p['seccion_id']}</td>";
        echo "<td>" . ($tieneIva ? "<span class='ok'>✅ SÍ</span>" : "<span class='no'>No</span>") . "</td>";
        echo "</tr>";
    }
    echo "</table>";

    // 2. Todas las opciones de respuesta que contengan palabras clave
    echo "<h2>2. Opciones con palabras clave relacionadas a IVA / régimen impositivo</h2>";
    $stmt2 = $pdo->query("
        SELECT o.id as opcion_id, o.texto_opcion, o.pregunta_id, p.texto_pregunta
        FROM opcion o 
        JOIN pregunta p ON o.pregunta_id = p.id
        WHERE o.texto_opcion LIKE '%Monotribut%'
           OR o.texto_opcion LIKE '%Inscripto%'
           OR o.texto_opcion LIKE '%IVA%'
           OR o.texto_opcion LIKE '%Exento%'
           OR o.texto_opcion LIKE '%Consumidor%'
           OR o.texto_opcion LIKE '%régimen%'
           OR o.texto_opcion LIKE '%regimen%'
        ORDER BY o.pregunta_id
    ");
    $opciones = $stmt2->fetchAll();
    if ($opciones) {
        echo "<table><tr><th>Pregunta ID</th><th>Texto Pregunta</th><th>Opcion ID</th><th>Texto Opcion</th></tr>";
        foreach ($opciones as $o) {
            echo "<tr><td>{$o['pregunta_id']}</td><td>" . htmlspecialchars($o['texto_pregunta']) . "</td><td>{$o['opcion_id']}</td><td>" . htmlspecialchars($o['texto_opcion']) . "</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='no'>❌ No se encontraron opciones con esas palabras clave.</p>";
        
        // Mostrar TODAS las opciones para que puedas buscar manualmente
        echo "<h2>2b. TODAS las opciones de respuesta (para buscar manualmente)</h2>";
        $stmt3 = $pdo->query("SELECT o.id, o.texto_opcion, o.pregunta_id, p.texto_pregunta FROM opcion o JOIN pregunta p ON o.pregunta_id = p.id ORDER BY o.pregunta_id LIMIT 200");
        $todas = $stmt3->fetchAll();
        echo "<table><tr><th>Pregunta ID</th><th>Texto Pregunta</th><th>Opcion ID</th><th>Texto Opcion</th></tr>";
        foreach ($todas as $o) {
            echo "<tr><td>{$o['pregunta_id']}</td><td>" . htmlspecialchars($o['texto_pregunta']) . "</td><td>{$o['id']}</td><td>" . htmlspecialchars($o['texto_opcion']) . "</td></tr>";
        }
        echo "</table>";
    }

    // 3. Últimas respuestas cargadas
    echo "<h2>3. Últimas 10 respuestas en la base de datos</h2>";
    $stmt4 = $pdo->query("
        SELECT r.id, r.pregunta_id, p.texto_pregunta, r.opcion_id, o.texto_opcion, r.valor_texto, r.sector_id, s.nombre as sector, r.encuesta_periodo_id, r.fecha_respuesta
        FROM respuesta r
        JOIN pregunta p ON r.pregunta_id = p.id
        LEFT JOIN opcion o ON r.opcion_id = o.id
        LEFT JOIN sector s ON r.sector_id = s.id
        ORDER BY r.id DESC LIMIT 10
    ");
    $respuestas = $stmt4->fetchAll();
    if ($respuestas) {
        echo "<table><tr><th>ID</th><th>Pregunta</th><th>Opcion</th><th>Valor texto</th><th>Sector</th><th>Periodo</th><th>Fecha</th></tr>";
        foreach ($respuestas as $r) {
            echo "<tr>";
            echo "<td>{$r['id']}</td>";
            echo "<td>[{$r['pregunta_id']}] " . htmlspecialchars(mb_substr($r['texto_pregunta'], 0, 50)) . "</td>";
            echo "<td>" . htmlspecialchars($r['texto_opcion'] ?? '-') . "</td>";
            echo "<td>" . htmlspecialchars($r['valor_texto'] ?? '-') . "</td>";
            echo "<td>" . ($r['sector'] ?? "<span class='no'>NULL</span>") . "</td>";
            echo "<td>{$r['encuesta_periodo_id']}</td>";
            echo "<td>{$r['fecha_respuesta']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='no'>❌ No hay respuestas en la base de datos.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}

echo "</body></html>";
