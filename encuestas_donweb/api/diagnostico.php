<?php
/**
 * Panel de Diagnóstico para Administradores
 * 
 * Muestra:
 * - Últimos errores registrados
 * - Encuestas incompletas
 * - Pregunta donde se produjo el fallo
 * - Fecha y hora del incidente
 * 
 * Acceso: /encuestas/api/diagnostico.php?token=ADMIN_TOKEN
 */

require_once __DIR__ . '/config.php';

// ── Autenticación ───────────────────────────────────────────────────────
if (!is_authenticated()) {
    header('Content-Type: text/html; charset=utf-8', true, 401);
    echo "<html><body style='font-family:sans-serif;padding:2rem;background:#f1f5f9;color:#1e293b;'>";
    echo "<h1>Acceso no autorizado</h1>";
    echo "<p>Debes iniciar sesión en el panel de administración primero.</p>";
    echo "<p><a href='/encuestas/'>Volver al inicio</a></p>";
    echo "</body></html>";
    exit;
}

// ── Obtener datos ───────────────────────────────────────────────────────
$limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 500) : 100;

// Logs de error
$errorLogs = survey_get_logs($limit, 'ERROR');

// Logs recientes (todos los niveles)
$recentLogs = survey_get_logs($limit);

// Estadísticas de errores
$errorStats = survey_get_error_stats();

// Encuestas incompletas (respuestas que empezaron pero no completaron)
$incompleteSurveys = [];
try {
    // Buscar sesiones que tengan respuestas pero sin 'respuestas_encuesta' completa
    $stmt = $pdo->prepare("
        SELECT r.encuesta_periodo_id, r.localidad_id, r.fecha_respuesta, 
               ep.mes, ep.anio, e.titulo as encuesta_titulo,
               COUNT(DISTINCT r.pregunta_id) as preguntas_respondidas,
               (SELECT COUNT(*) FROM encuesta_pregunta WHERE encuesta_id = ep.encuesta_id) as preguntas_totales
        FROM respuesta r
        JOIN encuesta_periodo ep ON r.encuesta_periodo_id = ep.id
        JOIN encuesta e ON ep.encuesta_id = e.id
        GROUP BY r.encuesta_periodo_id, r.localidad_id, r.fecha_respuesta, ep.mes, ep.anio, e.titulo, ep.encuesta_id
        HAVING preguntas_respondidas < preguntas_totales
        ORDER BY r.fecha_respuesta DESC
        LIMIT 50
    ");
    $stmt->execute();
    $incompleteSurveys = $stmt->fetchAll();
} catch (Exception $e) {
    survey_log_error('diagnostico_incompletas', $e);
}

// ── UI ──────────────────────────────────────────────────────────────────
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Diagnóstico - Encuestas</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; padding: 1.5rem; }
        h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #0ea5e9; }
        h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #334155; display: flex; align-items: center; gap: 0.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .header-controls { display: flex; gap: 0.5rem; align-items: center; }
        .header-controls select, .header-controls button { padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; font-size: 0.9rem; }
        .header-controls button { background: #0ea5e9; color: white; border-color: #0ea5e9; cursor: pointer; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.2rem; border-radius: 0.8rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid #0ea5e9; }
        .stat-card.error { border-left-color: #ef4444; }
        .stat-card.warn { border-left-color: #f59e0b; }
        .stat-number { font-size: 2rem; font-weight: 700; color: #0ea5e9; }
        .stat-card.error .stat-number { color: #ef4444; }
        .stat-card.warn .stat-number { color: #f59e0b; }
        .stat-label { font-size: 0.85rem; color: #64748b; margin-top: 0.3rem; }
        .card { background: white; border-radius: 0.8rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1.5rem; margin-bottom: 1.5rem; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        th { text-align: left; padding: 0.6rem 0.8rem; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; white-space: nowrap; }
        td { padding: 0.6rem 0.8rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        tr:hover td { background: #f8fafc; }
        .level-ERROR { color: #ef4444; font-weight: 600; }
        .level-WARN { color: #f59e0b; font-weight: 600; }
        .level-INFO { color: #0ea5e9; }
        .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .badge-error { background: #fef2f2; color: #dc2626; }
        .badge-warn { background: #fffbeb; color: #d97706; }
        .badge-info { background: #eff6ff; color: #2563eb; }
        .details-btn { background: none; border: 1px solid #cbd5e1; border-radius: 0.3rem; padding: 0.2rem 0.5rem; cursor: pointer; font-size: 0.8rem; color: #64748b; }
        .details-btn:hover { background: #f1f5f9; }
        .details-content { display: none; margin-top: 0.5rem; padding: 0.8rem; background: #1e293b; color: #f8fafc; border-radius: 0.5rem; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; max-height: 300px; overflow: auto; }
        .details-content.open { display: block; }
        .empty { text-align: center; padding: 3rem; color: #94a3b8; }
        .footer { text-align: center; margin-top: 2rem; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }
        .section-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .section-tab { padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 0.9rem; }
        .section-tab.active { background: #0ea5e9; color: white; border-color: #0ea5e9; }
        .section { display: none; }
        .section.active { display: block; }
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            table { font-size: 0.8rem; }
            th, td { padding: 0.4rem 0.5rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🔍 Panel de Diagnóstico</h1>
            <p style="color: #64748b;">Sistema de Encuestas - Monitoreo y depuración</p>
        </div>
        <div class="header-controls">
            <button onclick="window.location.reload()">🔄 Recargar</button>
            <button onclick="document.querySelector('.details-content.open')?.classList.remove('open')">Cerrar detalles</button>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card error">
            <div class="stat-number"><?= $errorStats['total'] ?></div>
            <div class="stat-label">Errores totales registrados</div>
        </div>
        <div class="stat-card">
            <div class="stat-number"><?= count($errorStats['by_type']) ?></div>
            <div class="stat-label">Tipos de error distintos</div>
        </div>
        <div class="stat-card warn">
            <div class="stat-number"><?= count($incompleteSurveys) ?></div>
            <div class="stat-label">Encuestas incompletas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number"><?= count($recentLogs) ?></div>
            <div class="stat-label">Eventos registrados (últimos <?= $limit ?>)</div>
        </div>
    </div>

    <div class="section-tabs">
        <div class="section-tab active" onclick="switchSection('errores', this)">🚨 Errores</div>
        <div class="section-tab" onclick="switchSection('incompletas', this)">📋 Encuestas Incompletas</div>
        <div class="section-tab" onclick="switchSection('recientes', this)">📜 Todos los Eventos</div>
        <div class="section-tab" onclick="switchSection('estadisticas', this)">📊 Estadísticas</div>
    </div>

    <div id="section-errores" class="section active">
        <div class="card">
            <h2>🚨 Últimos Errores</h2>
            <?php if (empty($errorLogs)): ?>
                <div class="empty">✅ No hay errores registrados. ¡Todo funciona correctamente!</div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Nivel</th>
                            <th>Acción</th>
                            <th>Usuario</th>
                            <th>IP</th>
                            <th>Mensaje</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($errorLogs as $log): 
                            $msg = $log['details']['message'] ?? ($log['details']['mensaje'] ?? '-');
                            $action = $log['action'] ?? '-';
                            $user = $log['user'] ?? '-';
                            $ip = $log['ip'] ?? '-';
                            $ts = $log['timestamp'] ?? '-';
                            $level = $log['level'] ?? 'INFO';
                        ?>
                        <tr>
                            <td style="white-space:nowrap;"><?= htmlspecialchars($ts) ?></td>
                            <td><span class="badge badge-error"><?= htmlspecialchars($level) ?></span></td>
                            <td><?= htmlspecialchars($action) ?></td>
                            <td><?= htmlspecialchars($user) ?></td>
                            <td><?= htmlspecialchars($ip) ?></td>
                            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;"><?= htmlspecialchars(mb_substr($msg, 0, 120)) ?></td>
                            <td><button class="details-btn" onclick="toggleDetails(this)">Ver</button></td>
                        </tr>
                        <tr style="display:none;">
                            <td colspan="7">
                                <div class="details-content"><?= htmlspecialchars(json_encode($log, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <div id="section-incompletas" class="section">
        <div class="card">
            <h2>📋 Encuestas Incompletas</h2>
            <?php if (empty($incompleteSurveys)): ?>
                <div class="empty">✅ No se detectaron encuestas incompletas.</div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Encuesta</th>
                            <th>Período</th>
                            <th>Fecha Respuesta</th>
                            <th>Localidad ID</th>
                            <th>Preguntas Respondidas</th>
                            <th>Preguntas Totales</th>
                            <th>% Completado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($incompleteSurveys as $row): 
                            $respondidas = (int)$row['preguntas_respondidas'];
                            $totales = (int)$row['preguntas_totales'];
                            $pct = $totales > 0 ? round(($respondidas / $totales) * 100) : 0;
                        ?>
                        <tr>
                            <td><?= htmlspecialchars($row['encuesta_titulo']) ?></td>
                            <td><?= htmlspecialchars($row['mes'] . '/' . $row['anio']) ?></td>
                            <td><?= htmlspecialchars($row['fecha_respuesta']) ?></td>
                            <td><?= (int)$row['localidad_id'] ?></td>
                            <td><?= $respondidas ?></td>
                            <td><?= $totales ?></td>
                            <td><?= $pct ?>%</td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <div id="section-recientes" class="section">
        <div class="card">
            <h2>📜 Eventos Recientes</h2>
            <?php if (empty($recentLogs)): ?>
                <div class="empty">No hay eventos registrados aún.</div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Nivel</th>
                            <th>Acción</th>
                            <th>Usuario</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentLogs as $log): 
                            $level = $log['level'] ?? 'INFO';
                            $badgeClass = $level === 'ERROR' ? 'badge-error' : ($level === 'WARN' ? 'badge-warn' : 'badge-info');
                        ?>
                        <tr>
                            <td style="white-space:nowrap;"><?= htmlspecialchars($log['timestamp'] ?? '-') ?></td>
                            <td><span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($level) ?></span></td>
                            <td><?= htmlspecialchars($log['action'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($log['user'] ?? '-') ?></td>
                            <td><button class="details-btn" onclick="toggleDetails(this)">Ver</button></td>
                        </tr>
                        <tr style="display:none;">
                            <td colspan="5">
                                <div class="details-content"><?= htmlspecialchars(json_encode($log, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <div id="section-estadisticas" class="section">
        <div class="card">
            <h2>📊 Errores por Tipo</h2>
            <?php if (empty($errorStats['by_type'])): ?>
                <div class="empty">No hay errores registrados.</div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Error</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($errorStats['by_type'] as $type => $count): ?>
                        <tr>
                            <td><?= htmlspecialchars($type) ?></td>
                            <td><strong><?= $count ?></strong></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <div class="card">
            <h2>📊 Errores por Fecha</h2>
            <?php if (empty($errorStats['by_date'])): ?>
                <div class="empty">No hay errores registrados.</div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Errores</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($errorStats['by_date'] as $date => $count): ?>
                        <tr>
                            <td><?= htmlspecialchars($date) ?></td>
                            <td><strong><?= $count ?></strong></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>

    <div class="footer">
        Panel de Diagnóstico - Encuestas CEM · 
        <a href="?limit=500" style="color:#0ea5e9;">Ver 500 eventos</a> · 
        <a href="?limit=50" style="color:#0ea5e9;">Ver 50 eventos</a>
    </div>

    <script>
        function switchSection(id, btn) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            document.getElementById('section-' + id).classList.add('active');
            btn.classList.add('active');
        }

        function toggleDetails(btn) {
            const row = btn.closest('tr');
            const nextRow = row.nextElementSibling;
            const details = nextRow?.querySelector('.details-content');
            if (details) {
                details.classList.toggle('open');
                nextRow.style.display = details.classList.contains('open') ? 'table-row' : 'none';
                btn.textContent = details.classList.contains('open') ? 'Ocultar' : 'Ver';
            }
        }
    </script>
</body>
</html>
