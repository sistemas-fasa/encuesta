const fs = require('fs');
const path = 'C:\\Users\\Pc\\Documents\\Encuestas\\backend\\server.js';
let content = fs.readFileSync(path, 'utf8');

if (content.includes('/api/usuarios')) {
    console.log('Routes already exist.');
    process.exit(0);
}

const routesToAdd = `
// --- Usuarios ---
app.get('/api/usuarios', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, usuario, rol, nombre, estado, created_at FROM usuarios ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/usuarios', isAuthenticated, async (req, res) => {
    const { usuario, password, nombre, rol, estado } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (usuario, password, nombre, rol, estado) VALUES (?, ?, ?, ?, ?)',
            [usuario, hashedPassword, nombre, rol || 'admin', estado !== undefined ? estado : 1]
        );
        res.json({ id: result.insertId, message: 'Usuario creado' });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/usuarios/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { usuario, password, nombre, rol, estado } = req.body;
    try {
        let query, params;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE usuarios SET usuario=?, password=?, nombre=?, rol=?, estado=? WHERE id=?';
            params = [usuario, hashedPassword, nombre, rol || 'admin', estado, id];
        } else {
            query = 'UPDATE usuarios SET usuario=?, nombre=?, rol=?, estado=? WHERE id=?';
            params = [usuario, nombre, rol || 'admin', estado, id];
        }
        await pool.query(query, params);
        res.json({ message: 'Usuario actualizado' });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/usuarios/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: error.message });
    }
});
`;

const insertTarget = "// Get all surveys (Admin)";
const lines = content.split('\n');
const insertIdx = lines.findIndex(l => l.includes(insertTarget));

if (insertIdx === -1) {
    console.error("Target not found in server.js");
    process.exit(1);
}

lines.splice(insertIdx, 0, routesToAdd);
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Routes added successfully to server.js');
