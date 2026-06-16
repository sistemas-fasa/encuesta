const fs = require('fs');
const paths = [
    'C:\\Users\\Pc\\Documents\\Encuestas\\public\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb - copia\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\dist\\api\\api.php'
];

const getCode = `
        // SORTEOS
        if ($requestPath === '/sorteos') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("SELECT * FROM sorteos ORDER BY id DESC");
            $sorteos = $stmt->fetchAll();
            foreach ($sorteos as &$s) {
                $stmtC = $pdo->prepare("SELECT id_camara FROM sorteos_camaras WHERE id_sorteo = ?");
                $stmtC->execute([$s['id']]);
                $s['camaras'] = array_column($stmtC->fetchAll(), 'id_camara');
            }
            send_json($sorteos);
        }
        if ($matches = match_route('/sorteos/:id/participantes', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $camara_id = $_GET['camara_id'] ?? null;
            $sql = "SELECT s.*, c.nombre as camara_nombre FROM sorteo s JOIN camara c ON s.id_camara = c.id WHERE s.id_sorteo = ?";
            $params = [$id];
            if ($camara_id) {
                $sql .= " AND s.id_camara = ?";
                $params[] = $camara_id;
            }
            $sql .= " ORDER BY s.fecha_registro DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            send_json($stmt->fetchAll());
        }
        if ($matches = match_route('/public/camaras/:id/sorteo-activo', $requestPath)) {
            $id = $matches['id'];
            $stmt = $pdo->prepare("SELECT s.* FROM sorteos s JOIN sorteos_camaras sc ON s.id = sc.id_sorteo WHERE sc.id_camara = ? AND s.activo = 1 AND CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin LIMIT 1");
            $stmt->execute([$id]);
            $sorteo = $stmt->fetch();
            if ($sorteo) {
                send_json(['activo' => true, 'sorteo' => $sorteo]);
            } else {
                send_json(['activo' => false]);
            }
        }
`;

const postCode = `
        // SORTEOS
        if ($requestPath === '/sorteos') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("INSERT INTO sorteos (nombre, periodo, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?)");
                $activo = empty($input['activo']) ? 0 : 1;
                $stmt->execute([$input['nombre'], $input['periodo'], $input['fecha_inicio'], $input['fecha_fin'], $activo]);
                $id = $pdo->lastInsertId();
                if (!empty($input['camaras'])) {
                    $stmtC = $pdo->prepare("INSERT INTO sorteos_camaras (id_sorteo, id_camara) VALUES (?, ?)");
                    foreach ($input['camaras'] as $cid) {
                        $stmtC->execute([$id, $cid]);
                    }
                }
                $pdo->commit();
                send_json(['id' => $id, 'message' => 'Sorteo creado']);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }
        if ($requestPath === '/public/sorteos/participar') {
            try {
                $stmt = $pdo->prepare("INSERT INTO sorteo (id_sorteo, id_camara, apellido, nombre, domicilio, telefono) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id_sorteo'], $input['id_camara'], $input['apellido'], $input['nombre'], $input['domicilio'], $input['telefono']]);
                send_json(['message' => 'Participacion registrada']);
            } catch (Exception $e) {
                send_json(['error' => $e->getMessage()], 500);
            }
        }
`;

const putCode = `
        // SORTEOS
        if ($matches = match_route('/sorteos/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $pdo->beginTransaction();
            try {
                $activo = empty($input['activo']) ? 0 : 1;
                $stmt = $pdo->prepare("UPDATE sorteos SET nombre = ?, periodo = ?, fecha_inicio = ?, fecha_fin = ?, activo = ? WHERE id = ?");
                $stmt->execute([$input['nombre'], $input['periodo'], $input['fecha_inicio'], $input['fecha_fin'], $activo, $id]);
                
                $pdo->prepare("DELETE FROM sorteos_camaras WHERE id_sorteo = ?")->execute([$id]);
                if (!empty($input['camaras'])) {
                    $stmtC = $pdo->prepare("INSERT INTO sorteos_camaras (id_sorteo, id_camara) VALUES (?, ?)");
                    foreach ($input['camaras'] as $cid) {
                        $stmtC->execute([$id, $cid]);
                    }
                }
                $pdo->commit();
                send_json(['message' => 'Sorteo actualizado']);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }
        if ($matches = match_route('/sorteos/:id/status', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $activo = empty($input['activo']) ? 0 : 1;
            $stmt = $pdo->prepare("UPDATE sorteos SET activo = ? WHERE id = ?");
            $stmt->execute([$activo, $id]);
            send_json(['message' => 'Estado actualizado']);
        }
`;

const deleteCode = `
        // SORTEOS
        if ($matches = match_route('/sorteos/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM sorteos WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Sorteo eliminado']);
        }
`;

function insertAfter(linesArray, targetStr, insertStr) {
    const idx = linesArray.findIndex(l => l.includes(targetStr));
    if (idx !== -1) {
        linesArray.splice(idx + 1, 0, insertStr);
    }
}

paths.forEach(p => {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        if (content.includes("if ($requestPath === '/sorteos')")) {
            console.log('Already applied to ' + p);
            return;
        }
        let lines = content.split('\n');
        insertAfter(lines, "case 'GET':", getCode);
        insertAfter(lines, "case 'POST':", postCode);
        insertAfter(lines, "case 'PUT':", putCode);
        insertAfter(lines, "case 'DELETE':", deleteCode);
        fs.writeFileSync(p, lines.join('\n'), 'utf8');
        console.log('Patched ' + p);
    }
});
