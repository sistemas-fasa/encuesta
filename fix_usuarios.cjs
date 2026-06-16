const fs = require('fs');

const paths = [
    'C:\\Users\\Pc\\Documents\\Encuestas\\public\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\dist\\api\\api.php'
];

const getCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("SELECT id, username, rol FROM usuario");
            send_json($stmt->fetchAll());
        }
`;

const postCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            if (!$username || !$password) send_json(['error' => 'Usuario y contraseña requeridos'], 400);
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuario (username, password, rol) VALUES (?, ?, ?)");
            try {
                $stmt->execute([$username, $hash, $rol]);
                send_json(['id' => $pdo->lastInsertId(), 'message' => 'Usuario creado']);
            } catch (Exception $e) {
                send_json(['error' => 'Error al crear usuario'], 500);
            }
        }
`;

const putCode = `
        // USUARIOS
        if ($matches = match_route('/usuarios/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            if ($password) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuario SET username = ?, password = ?, rol = ? WHERE id = ?");
                $stmt->execute([$username, $hash, $rol, $matches['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE usuario SET username = ?, rol = ? WHERE id = ?");
                $stmt->execute([$username, $rol, $matches['id']]);
            }
            send_json(['message' => 'Usuario actualizado']);
        }
`;

const deleteCode = `
        // USUARIOS
        if ($matches = match_route('/usuarios/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM usuario WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Usuario eliminado']);
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
        let lines = content.split(/\\r?\\n/);
        
        if (!content.includes("if ($requestPath === '/usuarios')")) {
            insertAfter(lines, "case 'GET':", getCode);
            insertAfter(lines, "case 'POST':", postCode);
            insertAfter(lines, "case 'PUT':", putCode);
            insertAfter(lines, "case 'DELETE':", deleteCode);
            fs.writeFileSync(p, lines.join('\\n'), 'utf8');
            console.log('Successfully patched ' + p);
        } else {
            console.log('Already patched ' + p);
        }
    }
});
