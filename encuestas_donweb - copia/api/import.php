<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if (!is_authenticated()) {
    send_json(['error' => 'No autorizado'], 401);
}

try {
    if ($method === 'POST' && $action === 'upload_batch') {
        $filename = $input['filename'] ?? 'unknown.xlsx';
        $total_rows = $input['total_rows'] ?? 0;
        $batch_index = $input['batch_index'] ?? 0;
        $rows = $input['rows'] ?? [];
        $import_id = $input['import_id'] ?? null;
        
        $pdo->beginTransaction();
        
        // Create new import session
        if (!$import_id && $batch_index === 0) {
            $stmt = $pdo->prepare("INSERT INTO import_history (filename, total_rows, imported_by) VALUES (?, ?, ?)");
            $stmt->execute([$filename, $total_rows, current_user_id()]);
            $import_id = $pdo->lastInsertId();
        }
        
        if (!$import_id) throw new Exception("No import_id provided");
        
        // Insert rows into temp
        $stmt = $pdo->prepare("INSERT INTO temp_import_data (import_id, row_number, raw_data, status) VALUES (?, ?, ?, 'pendiente')");
        foreach ($rows as $row) {
            $stmt->execute([$import_id, $row['index'], json_encode($row['data'])]);
        }
        
        $pdo->commit();
        send_json(['message' => 'Lote subido', 'import_id' => $import_id]);
    }
    
    if ($method === 'POST' && $action === 'commit') {
        $import_id = $input['import_id'] ?? null;
        if (!$import_id) throw new Exception("No import_id");
        
        // Here we would move data from temp_import_data to the actual tables.
        // For now, mark as completed
        $stmt = $pdo->prepare("UPDATE import_history SET status = 'completado', completed_at = NOW() WHERE id = ?");
        $stmt->execute([$import_id]);
        
        send_json(['message' => 'Importación completada']);
    }
    
    send_json(['error' => 'Acción no válida'], 400);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    send_json(['error' => $e->getMessage()], 500);
}
?>
