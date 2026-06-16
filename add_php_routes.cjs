const fs = require('fs');
const path = 'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb\\api\\api.php';
let content = fs.readFileSync(path, 'utf8');

if (content.includes('/usuarios') && content.includes('Usuarios CRUD')) {
    console.log('PHP Routes already exist.');
    process.exit(0);
}

const lines = content.split('\n');

const getCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("SELECT id, usuario, rol, nombre, estado, created_at FROM usuarios ORDER BY id DESC");
            send_json($stmt->fetchAll());
        }
`;

const postCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $user = $input['usuario'] ?? '';
            $pass = $input['password'] ?? '';
            $nombre = $input['nombre'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            $estado = isset($input['estado']) ? $input['estado'] : 1;
            
            $hashed = password_hash($pass, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (usuario, password, nombre, rol, estado) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$user, $hashed, $nombre, $rol, $estado]);
            send_json(['id' => $pdo->lastInsertId(), 'message' => 'Usuario creado']);
        }
`;

const putCode = `
        // USUARIOS
        if ($matches = match_route('/usuarios/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $user = $input['usuario'] ?? '';
            $pass = $input['password'] ?? '';
            $nombre = $input['nombre'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            $estado = isset($input['estado']) ? $input['estado'] : 1;
            
            if (!empty($pass)) {
                $hashed = password_hash($pass, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuarios SET usuario = ?, password = ?, nombre = ?, rol = ?, estado = ? WHERE id = ?");
                $stmt->execute([$user, $hashed, $nombre, $rol, $estado, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE usuarios SET usuario = ?, nombre = ?, rol = ?, estado = ? WHERE id = ?");
                $stmt->execute([$user, $nombre, $rol, $estado, $id]);
            }
            send_json(['message' => 'Usuario actualizado']);
        }
`;

const deleteCode = `
        // USUARIOS
        if ($matches = match_route('/usuarios/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Usuario eliminado']);
        }
`;

function insertAfter(linesArray, targetStr, insertStr) {
    const idx = linesArray.findIndex(l => l.includes(targetStr));
    if (idx !== -1) {
        linesArray.splice(idx + 1, 0, insertStr);
    } else {
        console.error("Target not found: " + targetStr);
        process.exit(1);
    }
}

insertAfter(lines, "case 'GET':", getCode);
insertAfter(lines, "case 'POST':", postCode);
insertAfter(lines, "case 'PUT':", putCode);
insertAfter(lines, "case 'DELETE':", deleteCode);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('PHP Routes added successfully');
