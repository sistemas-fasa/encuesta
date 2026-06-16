<?php
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<html><head><title>Debugger de IVA - Sistema de Encuestas</title>";
echo "<style>body{font-family:sans-serif;background:#f1f5f9;color:#1e293b;padding:2rem;} h1{color:#0ea5e9;} pre{background:#1e293b;color:#f8fafc;padding:1rem;border-radius:0.5rem;overflow:auto;} .card{background:white;padding:1.5rem;border-radius:0.8rem;box-shadow:0 4px 6px rgba(0,0,0,0.05);margin-bottom:1.5rem;}</style>";
echo "</head><body>";
echo "<h1>Diagnosticador del Sistema de Encuestas - Gráfico IVA</h1>";

try {
    // 1. Mostrar las preguntas de la base de datos
    echo "<div class='card'><h2>1. Preguntas Registradas</h2>";
    $stmt = $pdo->prepare("SELECT id, texto_pregunta, tipo, seccion_id FROM pregunta ORDER BY id");
    $stmt->execute();
    $preguntas = $stmt->fetchAll();
    echo "<pre>" . json_encode($preguntas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
    echo "</div>";

    // 2. Intentar buscar los IDs usando el algoritmo de la API
    echo "<div class='card'><h2>2. Identificación Dinámica de Preguntas</h2>";
    
    // Robust option-text lookup first
    $stmtIvaQ = $pdo->prepare("
        SELECT p.id, p.texto_pregunta FROM pregunta p 
        JOIN opcion o ON o.pregunta_id = p.id 
        WHERE o.texto_opcion LIKE '%Monotribut%' 
           OR o.texto_opcion LIKE '%Inscripto%' 
        LIMIT 1
    ");
    $stmtIvaQ->execute();
    $ivaQ = $stmtIvaQ->fetch();
    
    if (!$ivaQ) {
        // Fallback case-sensitive search excluding chemistry and mixed-case/lowercase substring overlaps like "productivas"
        $stmtIvaQFallback = $pdo->prepare("
            SELECT id, texto_pregunta FROM pregunta 
            WHERE (texto_pregunta LIKE BINARY '%IVA%' OR texto_pregunta LIKE BINARY '%I.V.A.%')
              AND texto_pregunta NOT LIKE '%Química%' 
              AND texto_pregunta NOT LIKE '%Quimica%' 
              AND texto_pregunta NOT LIKE '%productiva%' 
              AND texto_pregunta NOT LIKE '%productivo%' 
              AND texto_pregunta NOT LIKE '%derivados%'
            LIMIT 1
        ");
        $stmtIvaQFallback->execute();
        $ivaQ = $stmtIvaQFallback->fetch();
    }
    $ivaPreguntaId = $ivaQ ? $ivaQ['id'] : null;
    echo "<p><b>Pregunta IVA Identificada:</b> ID " . ($ivaPreguntaId ?? "NO ENCONTRADA") . " (<i>" . ($ivaQ ? htmlspecialchars($ivaQ['texto_pregunta']) : "-") . "</i>)</p>";

    // Robust rubro lookup
    $stmtRubroQ = $pdo->prepare("
        SELECT id, texto_pregunta FROM pregunta 
        WHERE (texto_pregunta LIKE '%rubro%' OR tipo = 'selector_rubro') 
          AND texto_pregunta NOT LIKE '%evalua%' 
          AND texto_pregunta NOT LIKE '%evalúa%' 
        LIMIT 1
    ");
    $stmtRubroQ->execute();
    $rubroQ = $stmtRubroQ->fetch();
    $rubroPreguntaId = $rubroQ ? $rubroQ['id'] : null;
    echo "<p><b>Pregunta Rubro Identificada:</b> ID " . ($rubroPreguntaId ?? "NO ENCONTRADA") . " (<i>" . ($rubroQ ? htmlspecialchars($rubroQ['texto_pregunta']) : "-") . "</i>)</p>";
    echo "</div>";

    // 3. Mostrar períodos activos
    echo "<div class='card'><h2>3. Períodos Activos</h2>";
    $stmtP = $pdo->prepare("SELECT id, mes, anio, encuesta_id FROM encuesta_periodo ORDER BY id DESC");
    $stmtP->execute();
    $periodos = $stmtP->fetchAll();
    echo "<pre>" . json_encode($periodos, JSON_PRETTY_PRINT) . "</pre>";
    echo "</div>";

    // 4. Probar consulta de respuestas para la pregunta IVA
    if ($ivaPreguntaId) {
        echo "<div class='card'><h2>4. Respuestas para la Pregunta IVA (ID $ivaPreguntaId)</h2>";
        $stmtAns = $pdo->prepare("SELECT valor_texto, opcion_id, COUNT(*) as c FROM respuesta WHERE pregunta_id = ? GROUP BY valor_texto, opcion_id");
        $stmtAns->execute([$ivaPreguntaId]);
        $ans = $stmtAns->fetchAll();
        echo "<pre>" . json_encode($ans, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
        echo "</div>";
    }

    // 5. Probar consulta de respuestas para la pregunta Rubro
    if ($rubroPreguntaId) {
        echo "<div class='card'><h2>5. Respuestas para la Pregunta Rubro (ID $rubroPreguntaId)</h2>";
        $stmtAns = $pdo->prepare("SELECT valor_texto, opcion_id, COUNT(*) as c FROM respuesta WHERE pregunta_id = ? GROUP BY valor_texto, opcion_id");
        $stmtAns->execute([rubroPreguntaId]);
        $ans = $stmtAns->fetchAll();
        echo "<pre>" . json_encode($ans, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
        echo "</div>";
    }

    // 6. Probar la consulta completa final
    if ($periodos && $ivaPreguntaId && $rubroPreguntaId) {
        $periodo_id = $periodos[0]['id'];
        echo "<div class='card'><h2>6. Ejecución del Query final de IVA para Período ID $periodo_id</h2>";
        
        $sqlIva = "SELECT 
                       COALESCE(iva_opt.texto_opcion, iva_r.valor_texto) AS iva_status,
                       s.id AS sector_id,
                       s.nombre AS sector_nombre,
                       s.color AS sector_color,
                       COUNT(DISTINCT iva_r.fecha_respuesta, iva_r.localidad_id) AS count
                   FROM respuesta iva_r
                   JOIN respuesta rubro_r 
                       ON iva_r.encuesta_periodo_id = rubro_r.encuesta_periodo_id
                      AND iva_r.localidad_id = rubro_r.localidad_id
                      AND iva_r.fecha_respuesta = rubro_r.fecha_respuesta
                   LEFT JOIN opcion iva_opt
                       ON iva_r.opcion_id = iva_opt.id
                   LEFT JOIN opcion rubro_opt
                       ON rubro_r.opcion_id = rubro_opt.id
                   LEFT JOIN seccion sec
                       ON rubro_opt.siguiente_seccion_id = sec.id
                   JOIN sector s 
                       ON s.id = COALESCE(
                           sec.sector_id,
                           CASE 
                               WHEN COALESCE(rubro_opt.texto_opcion, rubro_r.valor_texto) LIKE '%Comercio%' THEN 1
                               WHEN COALESCE(rubro_opt.texto_opcion, rubro_r.valor_texto) LIKE '%Produc%' THEN 2
                               WHEN COALESCE(rubro_opt.texto_opcion, rubro_r.valor_texto) LIKE '%Industria%' THEN 3
                               WHEN COALESCE(rubro_opt.texto_opcion, rubro_r.valor_texto) LIKE '%Turismo%' THEN 4
                               WHEN COALESCE(rubro_opt.texto_opcion, rubro_r.valor_texto) LIKE '%Servic%' THEN 5
                           END
                       )
                   WHERE iva_r.encuesta_periodo_id = ?
                     AND iva_r.pregunta_id = ?
                     AND rubro_r.pregunta_id = ?
                     AND COALESCE(iva_opt.texto_opcion, iva_r.valor_texto) IS NOT NULL";

        $stmtIva = $pdo->prepare($sqlIva . " GROUP BY iva_status, sector_id, sector_nombre, sector_color ORDER BY iva_status, s.orden");
        $stmtIva->execute([$periodo_id, $ivaPreguntaId, $rubroPreguntaId]);
        $ivaStats = $stmtIva->fetchAll();
        
        echo "<p><b>Registros devueltos por el query:</b> " . count($ivaStats) . "</p>";
        echo "<pre>" . json_encode($ivaStats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
        echo "</div>";
    }

} catch (Exception $e) {
    echo "<div class='card' style='border-left: 6px solid #ef4444;'><h2>🚨 Error de Ejecución</h2>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
}

echo "</body></html>";
?>
