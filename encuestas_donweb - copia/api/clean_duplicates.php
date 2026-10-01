<?php
/**
 * Script de migración para deduplicar preguntas en el Banco de Preguntas.
 * Fusiona las preguntas con texto idéntico, mapeando las respuestas y vinculaciones
 * a la pregunta original (más antigua) y eliminando los duplicados.
 */

// Desactivar el límite de tiempo si es necesario
set_time_limit(0);

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/config.php';

// Verificar autenticación o permitir ejecución CLI/parámetro de seguridad
if (php_sapi_name() !== 'cli' && (!isset($_GET['secure_key']) || $_GET['secure_key'] !== 'clean123')) {
    die("No autorizado. Ejecute vía CLI o añada ?secure_key=clean123 a la URL.");
}

try {
    $pdo->beginTransaction();
    echo "=== INICIANDO DETECCIÓN Y LIMPIEZA DE PREGUNTAS DUPLICADAS ===\n\n";

    // Obtener grupos de preguntas con el mismo texto
    $stmt = $pdo->query("
        SELECT texto_pregunta, COUNT(*) as c, GROUP_CONCAT(id ORDER BY id ASC) as ids 
        FROM pregunta 
        GROUP BY texto_pregunta 
        HAVING c > 1
    ");
    $duplicates = $stmt->fetchAll();

    echo "Se encontraron " . count($duplicates) . " grupos de preguntas con textos duplicados.\n\n";

    $totalFusionadas = 0;

    foreach ($duplicates as $group) {
        $ids = explode(',', $group['ids']);
        $originalId = $ids[0]; // La más antigua es la original
        $duplicateIds = array_slice($ids, 1);

        echo "Pregunta original: ID $originalId | Texto: \"" . mb_substr($group['texto_pregunta'], 0, 60) . "...\"\n";
        echo "  IDs duplicados a fusionar: " . implode(', ', $duplicateIds) . "\n";

        // Obtener las opciones de la original para el mapeo
        $stmtOptsOrig = $pdo->prepare("SELECT id, texto_opcion FROM opcion WHERE pregunta_id = ?");
        $stmtOptsOrig->execute([$originalId]);
        $optsOrig = $stmtOptsOrig->fetchAll();
        $optsOrigMap = [];
        foreach ($optsOrig as $oo) {
            $optsOrigMap[trim($oo['texto_opcion'])] = $oo['id'];
        }

        foreach ($duplicateIds as $dupId) {
            // Obtener opciones del duplicado
            $stmtOptsDup = $pdo->prepare("SELECT id, texto_opcion FROM opcion WHERE pregunta_id = ?");
            $stmtOptsDup->execute([$dupId]);
            $optsDup = $stmtOptsDup->fetchAll();

            // Mapear opciones del duplicado a la original
            foreach ($optsDup as $od) {
                $dupOptId = $od['id'];
                $optText = trim($od['texto_opcion']);
                if (isset($optsOrigMap[$optText])) {
                    $origOptId = $optsOrigMap[$optText];
                    // Actualizar respuestas que usan esta opción duplicada
                    $updRespOpt = $pdo->prepare("UPDATE respuesta SET opcion_id = ? WHERE pregunta_id = ? AND opcion_id = ?");
                    $updRespOpt->execute([$origOptId, $dupId, $dupOptId]);
                }
            }

            // Actualizar respuestas para apuntar al pregunta_id original
            $updRespQ = $pdo->prepare("UPDATE respuesta SET pregunta_id = ? WHERE pregunta_id = ?");
            $updRespQ->execute([$originalId, $dupId]);

            // Actualizar relaciones en encuesta_pregunta
            $updEp = $pdo->prepare("UPDATE encuesta_pregunta SET pregunta_id = ? WHERE pregunta_id = ?");
            $updEp->execute([$originalId, $dupId]);

            // Eliminar opciones del duplicado
            $delOpts = $pdo->prepare("DELETE FROM opcion WHERE pregunta_id = ?");
            $delOpts->execute([$dupId]);

            // Eliminar la pregunta duplicada
            $delQ = $pdo->prepare("DELETE FROM pregunta WHERE id = ?");
            $delQ->execute([$dupId]);

            echo "  -> Fusionado exitosamente ID $dupId en ID $originalId.\n";
            $totalFusionadas++;
        }
        echo "\n";
    }

    $pdo->commit();
    echo "=== MIGRACIÓN COMPLETADA CON ÉXITO ===\n";
    echo "Total de preguntas duplicadas eliminadas y unificadas: $totalFusionadas\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "🚨 ERROR DURANTE LA MIGRACIÓN: " . $e->getMessage() . "\n";
}
