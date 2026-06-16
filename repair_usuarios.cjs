const fs = require('fs');

const paths = [
    'C:\\Users\\Pc\\Documents\\Encuestas\\public\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\dist\\api\\api.php'
];

const newGetCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("SELECT id, usuario, nombre, email, rol, estado, fecha_creacion FROM usuarios");
            send_json($stmt->fetchAll());
        }
`;

const newPostCode = `
        // USUARIOS
        if ($requestPath === '/usuarios') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $usuario = $input['usuario'] ?? '';
            $password = $input['password'] ?? '';
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            $estado = isset($input['estado']) ? $input['estado'] : 1;

            if (!$usuario || !$password) send_json(['error' => 'Usuario y contraseña requeridos'], 400);
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (usuario, password, nombre, email, rol, estado) VALUES (?, ?, ?, ?, ?, ?)");
            try {
                $stmt->execute([$usuario, $hash, $nombre, $email, $rol, $estado]);
                send_json(['id' => $pdo->lastInsertId(), 'message' => 'Usuario creado']);
            } catch (Exception $e) {
                send_json(['error' => 'Error al crear usuario'], 500);
            }
        }
`;

const newPutCode = `
        // USUARIOS
        if ($matches = match_route('/usuarios/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $usuario = $input['usuario'] ?? '';
            $password = $input['password'] ?? '';
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $rol = $input['rol'] ?? 'admin';
            $estado = isset($input['estado']) ? $input['estado'] : 1;

            if ($password) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuarios SET usuario = ?, password = ?, nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?");
                $stmt->execute([$usuario, $hash, $nombre, $email, $rol, $estado, $matches['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE usuarios SET usuario = ?, nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?");
                $stmt->execute([$usuario, $nombre, $email, $rol, $estado, $matches['id']]);
            }
            send_json(['message' => 'Usuario actualizado']);
        }
`;

const newDeleteCode = `
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
    }
}

paths.forEach(p => {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        // Fix the literal \\n that I accidentally put in
        content = content.replace(/\\n/g, '\n');

        let lines = content.split(/\r?\n/);
        
        // Remove old USUARIOS blocks
        let cleanLines = [];
        let skip = false;
        let bracketCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('// USUARIOS')) {
                skip = true;
                bracketCount = 0;
                // Wait, some lines might be just // USUARIOS.
                // The next line is `if (...) {`. Let's just use a simpler removal method.
            }
            
            if (skip) {
                if (lines[i].includes('{')) bracketCount += (lines[i].match(/{/g) || []).length;
                if (lines[i].includes('}')) bracketCount -= (lines[i].match(/}/g) || []).length;
                
                // If we've processed an if block and bracketCount is 0, we can stop skipping
                if (bracketCount === 0 && lines[i].includes('}')) {
                    skip = false;
                    continue;
                }
            } else {
                cleanLines.push(lines[i]);
            }
        }

        // Now inject the new code correctly
        insertAfter(cleanLines, "case 'GET':", newGetCode);
        insertAfter(cleanLines, "case 'POST':", newPostCode);
        insertAfter(cleanLines, "case 'PUT':", newPutCode);
        insertAfter(cleanLines, "case 'DELETE':", newDeleteCode);

        fs.writeFileSync(p, cleanLines.join('\n'), 'utf8');
        console.log('Successfully repaired and patched ' + p);
    }
});
