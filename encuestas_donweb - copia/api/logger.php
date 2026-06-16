<?php
/**
 * Sistema de Logs para Encuestas
 * 
 * Registra navegación, respuestas, errores y eventos del usuario.
 * Los logs se almacenan en /encuestas/logs/ con rotación diaria.
 */

define('LOG_DIR', __DIR__ . '/../../logs');
define('LOG_FILE', LOG_DIR . '/encuestas_' . date('Y-m-d') . '.log');
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10 MB por archivo

// Asegurar que el directorio de logs exista
if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0755, true);
}

// Rotación: si el archivo supera el tamaño máximo, renombrarlo
if (is_file(LOG_FILE) && filesize(LOG_FILE) > LOG_MAX_SIZE) {
    $i = 1;
    while (is_file(LOG_FILE . '.' . $i)) { $i++; }
    @rename(LOG_FILE, LOG_FILE . '.' . $i);
    // Mantener solo los últimos 5 archivos rotados
    $rotated = glob(LOG_FILE . '.*');
    if (count($rotated) > 5) {
        $oldest = $rotated[0];
        $oldestTime = filemtime($oldest);
        foreach ($rotated as $r) {
            if (filemtime($r) < $oldestTime) {
                $oldest = $r;
                $oldestTime = filemtime($r);
            }
        }
        @unlink($oldest);
    }
}

/**
 * Registra un evento en el log.
 *
 * @param string $action    Tipo de evento (navegacion, respuesta, error, submit, etc.)
 * @param array  $details   Datos adicionales del evento
 * @param string $level     Nivel (INFO, WARN, ERROR)
 */
function survey_log($action, $details = [], $level = 'INFO') {
    $entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'level'     => $level,
        'action'    => $action,
        'session'   => session_id() ?: '(no-session)',
        'user'      => isset($_SESSION['user']) ? $_SESSION['user']['usuario'] : '(anonimo)',
        'ip'        => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        'details'   => $details
    ];

    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";

    $written = @file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
    if ($written === false) {
        error_log("[EncuestasLogger] No se pudo escribir en: " . LOG_FILE);
    }
}

/**
 * Registra un error con stack trace completo.
 */
function survey_log_error($context, $exception) {
    $details = [
        'message' => $exception->getMessage(),
        'file'    => $exception->getFile(),
        'line'    => $exception->getLine(),
        'trace'   => $exception->getTraceAsString(),
        'uri'     => $_SERVER['REQUEST_URI'] ?? '',
        'method'  => $_SERVER['REQUEST_METHOD'] ?? '',
        'input'   => file_get_contents('php://input') ?: null
    ];
    survey_log('error_' . $context, $details, 'ERROR');
}

/**
 * Obtiene las entradas de log más recientes.
 *
 * @param int    $limit   Cantidad máxima de entradas
 * @param string $level   Filtrar por nivel (INFO, WARN, ERROR) o null para todos
 * @return array
 */
function survey_get_logs($limit = 100, $level = null) {
    $logs = [];
    $files = glob(LOG_DIR . '/encuestas_*.log*');
    rsort($files);

    foreach ($files as $file) {
        if (!is_file($file)) continue;
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) continue;
        $lines = array_reverse($lines);

        foreach ($lines as $line) {
            $entry = json_decode($line, true);
            if (!$entry) continue;
            if ($level && ($entry['level'] ?? '') !== $level) continue;
            $logs[] = $entry;
            if (count($logs) >= $limit) break 2;
        }
    }

    return $logs;
}

/**
 * Obtiene estadísticas de errores agrupadas.
 */
function survey_get_error_stats() {
    $errors = survey_get_logs(1000, 'ERROR');
    $stats = [
        'total'    => count($errors),
        'by_type'  => [],
        'by_date'  => [],
        'recent'   => array_slice($errors, 0, 50)
    ];

    foreach ($errors as $e) {
        $action = $e['action'] ?? 'desconocido';
        $date   = substr($e['timestamp'] ?? '', 0, 10);

        if (!isset($stats['by_type'][$action])) $stats['by_type'][$action] = 0;
        $stats['by_type'][$action]++;

        if (!isset($stats['by_date'][$date])) $stats['by_date'][$date] = 0;
        $stats['by_date'][$date]++;
    }

    return $stats;
}
