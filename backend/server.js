import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors({
    origin: [
      'http://localhost:5173', 
      'http://127.0.0.1:5173',
      'https://camaralgsm.com.ar',
      'https://www.camaralgsm.com.ar'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer config for trend image uploads
const uploadsDir = path.join(__dirname, '../public/uploads/trends');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const trendStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const { encuesta_id, pregunta_id } = req.params;
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `trend_${encuesta_id}_${pregunta_id}_${Date.now()}${ext}`);
    }
});
const uploadTrend = multer({ 
    storage: trendStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
});

// MySQL Connection Pool (using .env config)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'encuestas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper to check connection on startup
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the MySQL local database!');
        
        // Auto-migration to add columns if not exist
        try {
            await connection.query('SELECT siguiente_seccion_id FROM seccion LIMIT 1');
        } catch (err) {
            console.log('Adding siguiente_seccion_id column to seccion table...');
            await connection.query('ALTER TABLE seccion ADD COLUMN siguiente_seccion_id INT NULL DEFAULT NULL');
        }
        
        try {
            await connection.query('SELECT color FROM seccion LIMIT 1');
        } catch (err) {
            console.log('Adding color column to seccion table...');
            await connection.query("ALTER TABLE seccion ADD COLUMN color VARCHAR(50) DEFAULT '#94a3b8'");
        }

        // Migration: tendencia_imagen table
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS tendencia_imagen (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    encuesta_id INT NOT NULL,
                    pregunta_id INT NOT NULL,
                    sector_id INT NULL,
                    imagen_path VARCHAR(500) NOT NULL,
                    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (encuesta_id) REFERENCES encuesta(id) ON DELETE CASCADE,
                    FOREIGN KEY (pregunta_id) REFERENCES pregunta(id) ON DELETE CASCADE,
                    UNIQUE KEY uk_encuesta_pregunta_sector (encuesta_id, pregunta_id, sector_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            // Add sector_id column if not exists (for existing tables)
            try {
                await connection.query("ALTER TABLE tendencia_imagen ADD COLUMN sector_id INT NULL AFTER pregunta_id");
            } catch (e) { /* already exists */ }
            try {
                await connection.query("ALTER TABLE tendencia_imagen DROP INDEX uk_encuesta_pregunta");
            } catch (e) { /* may not exist */ }
            try {
                await connection.query("ALTER TABLE tendencia_imagen ADD UNIQUE KEY uk_encuesta_pregunta_sector (encuesta_id, pregunta_id, sector_id)");
            } catch (e) { /* already exists */ }
            console.log('tendencia_imagen table ready');
        // Sincronizar usuario administrador con contraseña Fasa@2026
        try {
            const adminHash = '$2b$10$02B43gdpSPSazO9FAEdoEOG8QzmAJqo.TN9xTUmvR6EKSFAoThtCi';
            const [users] = await connection.query("SELECT id FROM usuarios WHERE usuario = 'admin'");
            if (users.length > 0) {
                await connection.query("UPDATE usuarios SET password = ?, estado = 1 WHERE usuario = 'admin'", [adminHash]);
                console.log('Usuario admin actualizado con contraseña Fasa@2026');
            } else {
                await connection.query("INSERT INTO usuarios (usuario, password, nombre, rol, estado) VALUES ('admin', ?, 'Administrador', 'admin', 1)", [adminHash]);
                console.log('Usuario admin creado con contraseña Fasa@2026');
            }
        } catch (err) {
            console.log('Note: admin user sync:', err.message);
        }

        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL database:', error.message);
    }
};

testConnection();

// Auth Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }
};

// DEBUG MIDDLEWARE
app.use((req, res, next) => {
    console.log(`[DEBUG] Received ${req.method} ${req.url}`);
    next();
});

app.get('/api/ping', (req, res) => res.send('pong'));

// --- BANCO DE PREGUNTAS (Question Bank) ---

// Get ALL questions (global bank, not filtered by survey)
app.get('/api/banco-preguntas', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, 
                   GROUP_CONCAT(o.texto_opcion ORDER BY o.id SEPARATOR '|||') as opciones_textos,
                   GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR '|||') as opciones_ids,
                   GROUP_CONCAT(COALESCE(o.valor, 'NULL_VAL') ORDER BY o.id SEPARATOR '|||') as opciones_valores,
                   GROUP_CONCAT(COALESCE(o.siguiente_seccion_id, '') ORDER BY o.id SEPARATOR '|||') as opciones_saltos
            FROM pregunta p 
            LEFT JOIN opcion o ON p.id = o.pregunta_id
            GROUP BY p.id ORDER BY p.categoria, p.orden, p.id
        `);
        const formatted = rows.map(r => ({
            ...r,
            opciones: (r.opciones_textos ? r.opciones_textos.split('|||') : []).map((t, i) => ({
                id: r.opciones_ids.split('|||')[i] ? Number(r.opciones_ids.split('|||')[i]) : null,
                texto: t,
                valor: r.opciones_valores.split('|||')[i] === 'NULL_VAL' ? null : Number(r.opciones_valores.split('|||')[i]),
                siguiente_seccion_id: r.opciones_saltos.split('|||')[i] ? Number(r.opciones_saltos.split('|||')[i]) : null
            })).filter(o => o.id !== null)
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create question in bank (no encuesta_id required)
app.post('/api/banco-preguntas', isAuthenticated, async (req, res) => {
    const { texto_pregunta, tipo, orden, categoria } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO pregunta (texto_pregunta, tipo, orden, categoria) VALUES (?, ?, ?, ?)',
            [texto_pregunta, tipo, orden || 0, categoria || null]
        );
        res.status(201).json({ id: result.insertId, texto_pregunta, tipo, orden, categoria });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update question in bank
app.put('/api/banco-preguntas/:id', isAuthenticated, async (req, res) => {
    const { texto_pregunta, tipo, orden, categoria } = req.body;
    try {
        await pool.query(
            'UPDATE pregunta SET texto_pregunta = ?, tipo = ?, orden = ?, categoria = ? WHERE id = ?',
            [texto_pregunta, tipo, orden || 0, categoria || null, req.params.id]
        );
        res.json({ message: 'Pregunta actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete question from bank
app.delete('/api/banco-preguntas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Check if question has responses
        const [respCheck] = await connection.query('SELECT COUNT(*) as c FROM respuesta WHERE pregunta_id = ?', [id]);
        if (respCheck[0].c > 0) {
            throw new Error('No se puede eliminar: esta pregunta tiene respuestas registradas. Elimine primero las respuestas.');
        }
        await connection.query('DELETE FROM opcion WHERE pregunta_id = ?', [id]);
        await connection.query('DELETE FROM pregunta WHERE id = ?', [id]);
        await connection.commit();
        res.json({ message: 'Pregunta eliminada del banco' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Routes

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND estado = 1', [usuario]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const user = rows[0];
        let hashToVerify = user.password || '';
        // Normalizar $2y$ (PHP) a $2b$ para compatibilidad total con el módulo bcrypt de Node.js
        if (hashToVerify.startsWith('$2y$')) {
            hashToVerify = '$2b$' + hashToVerify.substring(4);
        }
        const match = await bcrypt.compare(password, hashToVerify);
        
        if (match) {
            req.session.user = { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre };
            res.json({ message: 'Login exitoso', user: req.session.user });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Sesión cerrada' });
});

// Endpoint para restablecer contraseña de admin a Fasa@2026
app.all(['/api/reset_admin', '/api/reset_admin.php', '/reset_admin', '/reset_admin.php'], async (req, res) => {
    try {
        const adminHash = '$2b$10$02B43gdpSPSazO9FAEdoEOG8QzmAJqo.TN9xTUmvR6EKSFAoThtCi';
        const [users] = await pool.query("SELECT id FROM usuarios WHERE usuario = 'admin'");
        if (users.length > 0) {
            await pool.query("UPDATE usuarios SET password = ?, estado = 1 WHERE usuario = 'admin'", [adminHash]);
        } else {
            await pool.query("INSERT INTO usuarios (usuario, password, nombre, rol, estado) VALUES ('admin', ?, 'Administrador', 'admin', 1)", [adminHash]);
        }

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, message: 'Contraseña de admin actualizada con éxito a Fasa@2026', usuario: 'admin' });
        }

        res.send(`
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Restablecer Administrador</title>
            <style>body{font-family:system-ui,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .card{background:white;padding:2.5rem;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.08);max-width:440px;width:90%;text-align:center;border:1px solid #e2e8f0;}
            h2{color:#16a34a;margin-top:0;} p{color:#475569;} .box{background:#f1f5f9;padding:1rem;border-radius:8px;margin:1.5rem 0;text-align:left;font-family:monospace;}
            .btn{display:inline-block;padding:0.75rem 1.5rem;background:#0ea5e9;color:white;text-decoration:none;border-radius:8px;font-weight:600;}</style>
            </head><body><div class="card">
            <h2>✅ Contraseña Actualizada</h2>
            <p>La contraseña del usuario administrador ha sido actualizada con éxito en la base de datos activa.</p>
            <div class="box">
            <div><strong>Usuario:</strong> admin</div>
            <div><strong>Contraseña:</strong> Fasa@2026</div>
            <div><strong>Estado:</strong> Activo (1)</div>
            </div>
            <a class="btn" href="/login">Ir a Iniciar Sesión</a>
            </div></body></html>
        `);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CAMARAS CRUD
app.post('/api/camaras', isAuthenticated, async (req, res) => {
    const { nombre } = req.body;
    try {
        const [result] = await pool.query("INSERT INTO camara (nombre) VALUES (?)", [nombre]);
        res.json({ id: result.insertId, message: 'Cámara creada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/camaras/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        await pool.query("UPDATE camara SET nombre = ? WHERE id = ?", [nombre, id]);
        res.json({ message: 'Cámara actualizada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/camaras/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM camara WHERE id = ?", [id]);
        res.json({ message: 'Cámara eliminada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Check Session
app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

// --- SURVEY MANAGEMENT ROUTES ---


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

// Get all surveys (Admin)
app.get('/api/encuestas', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM encuesta ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active surveys (Public)
app.get('/api/public/encuestas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM encuesta WHERE estado = 1 ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle survey status
app.put('/api/encuestas/:id/status', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await pool.query('UPDATE encuesta SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new survey
app.post('/api/encuestas', isAuthenticated, async (req, res) => {
    const { titulo, descripcion } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO encuesta (titulo, descripcion) VALUES (?, ?)', [titulo, descripcion]);
        res.status(201).json({ id: result.insertId, titulo, descripcion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deleting survey (and all related data)
app.delete('/api/encuestas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Delete answers and meta
        await connection.query('DELETE FROM respuesta WHERE encuesta_periodo_id IN (SELECT id FROM encuesta_periodo WHERE encuesta_id = ?)', [id]);
        
        // 2. Delete periods
        await connection.query('DELETE FROM encuesta_periodo WHERE encuesta_id = ?', [id]);
        
        // 3. Delete options for all questions of this survey
        await connection.query('DELETE FROM opcion WHERE pregunta_id IN (SELECT id FROM pregunta WHERE encuesta_id = ?)', [id]);
        
        // 4. Delete questions
        await connection.query('DELETE FROM pregunta WHERE encuesta_id = ?', [id]);
        
        // 5. Delete survey
        const [result] = await connection.query('DELETE FROM encuesta WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            throw new Error('Encuesta no encontrada');
        }

        await connection.commit();
        res.json({ message: 'Encuesta eliminada correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update survey
app.put('/api/encuestas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    try {
        await pool.query('UPDATE encuesta SET titulo = ?, descripcion = ? WHERE id = ?', [titulo, descripcion, id]);
        res.json({ message: 'Encuesta actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Duplicated survey (Deep Copy)
app.post('/api/encuestas/:id/duplicate', isAuthenticated, async (req, res) => {
    const { id: originalSurveyId } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Get original survey
        const [surveys] = await connection.query('SELECT * FROM encuesta WHERE id = ?', [originalSurveyId]);
        if (surveys.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' });
        
        const original = surveys[0];
        const [newSurvey] = await connection.query('INSERT INTO encuesta (titulo, descripcion) VALUES (?, ?)', 
            [`Copia de ${original.titulo}`, original.descripcion]);
        const newSurveyId = newSurvey.insertId;

        // 2. Duplicate SECTIONS and map IDs
        const [sections] = await connection.query('SELECT * FROM seccion WHERE encuesta_id = ?', [originalSurveyId]);
        const sectionMap = {}; // Maps old section ID to new section ID
        for (const s of sections) {
            const [newSec] = await connection.query(
                'INSERT INTO seccion (encuesta_id, titulo, descripcion, orden, sector_id, color) VALUES (?, ?, ?, ?, ?, ?)',
                [newSurveyId, s.titulo, s.descripcion, s.orden, s.sector_id, s.color || '#94a3b8']
            );
            sectionMap[s.id] = newSec.insertId;
        }

        // 2b. Map siguiente_seccion_id for duplicated sections
        for (const s of sections) {
            if (s.siguiente_seccion_id) {
                const newSecId = sectionMap[s.id];
                const newNextSecId = sectionMap[s.siguiente_seccion_id] || null;
                if (newNextSecId) {
                    await connection.query('UPDATE seccion SET siguiente_seccion_id = ? WHERE id = ?', [newNextSecId, newSecId]);
                }
            }
        }

        // 3. Link existing QUESTIONS to new sections (Questions are unique/shared)
        const [questions] = await connection.query(`
            SELECT p.id as pregunta_id, ep.seccion_id as ep_seccion_id, ep.orden as ep_orden
            FROM pregunta p
            JOIN encuesta_pregunta ep ON p.id = ep.pregunta_id
            WHERE ep.encuesta_id = ?`, [originalSurveyId]);
            
        for (const q of questions) {
            const newSeccionId = q.ep_seccion_id ? sectionMap[q.ep_seccion_id] : null;
            
            // Insert into the pivot table ONLY, reusing the existing question
            await connection.query(
                'INSERT INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden) VALUES (?, ?, ?, ?)',
                [newSurveyId, q.pregunta_id, newSeccionId, q.ep_orden]
            );
        }

        // 4. OPTIONS are not duplicated because questions are unique and shared.

        await connection.commit();
        res.json({ message: 'Encuesta duplicada correctamente con todas sus secciones y lógica.', newId: newSurveyId });
    } catch (error) {
        await connection.rollback();
        console.error('Duplicate Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// --- SURVEY MANAGEMENT ROUTES ---

// ... (Get, status, create, delete, update endpoints remain same)

// --- UPDATED ROUTES ---

// Get all sections for a survey
app.get('/api/encuestas/:id/secciones', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM seccion WHERE encuesta_id = ? ORDER BY orden, id', [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/public/encuestas/:id/secciones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM seccion WHERE encuesta_id = ? ORDER BY orden, id', [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new section
app.post('/api/secciones', isAuthenticated, async (req, res) => {
    const { encuesta_id, titulo, descripcion, orden, sector_id, color, siguiente_seccion_id } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO seccion (encuesta_id, titulo, descripcion, orden, sector_id, color, siguiente_seccion_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [encuesta_id, titulo, descripcion || '', orden || 0, sector_id || null, color || '#94a3b8', siguiente_seccion_id || null]
        );
        res.status(201).json({ id: result.insertId, encuesta_id, titulo, descripcion, orden, sector_id, color, siguiente_seccion_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update section
app.put('/api/secciones/:id', isAuthenticated, async (req, res) => {
    const { titulo, descripcion, orden, sector_id, color, siguiente_seccion_id } = req.body;
    try {
        await pool.query(
            'UPDATE seccion SET titulo = ?, descripcion = ?, orden = ?, sector_id = ?, color = ?, siguiente_seccion_id = ? WHERE id = ?',
            [titulo, descripcion || '', orden || 0, sector_id || null, color || '#94a3b8', siguiente_seccion_id || null, req.params.id]
        );
        res.json({ message: 'Sección actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SORTEOS ROUTES ---

// Get all sorteos (admin)
app.get('/api/sorteos', isAuthenticated, async (req, res) => {
    try {
        const [sorteos] = await pool.query('SELECT * FROM sorteos ORDER BY id DESC');
        for (let s of sorteos) {
            const [camaras] = await pool.query('SELECT id_camara FROM sorteos_camaras WHERE id_sorteo = ?', [s.id]);
            s.camaras = camaras.map(c => c.id_camara);
        }
        res.json(sorteos);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create sorteo
app.post('/api/sorteos', isAuthenticated, async (req, res) => {
    const { nombre, periodo, fecha_inicio, fecha_fin, camaras, activo } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [r] = await connection.query(
            'INSERT INTO sorteos (nombre, periodo, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?)',
            [nombre, periodo, fecha_inicio, fecha_fin, activo ? 1 : 0]
        );
        const sorteoId = r.insertId;
        
        if (camaras && camaras.length > 0) {
            for (let cId of camaras) {
                await connection.query('INSERT INTO sorteos_camaras (id_sorteo, id_camara) VALUES (?, ?)', [sorteoId, cId]);
            }
        }
        await connection.commit();
        res.status(201).json({ id: sorteoId, message: 'Sorteo creado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update sorteo
app.put('/api/sorteos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { nombre, periodo, fecha_inicio, fecha_fin, camaras, activo } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE sorteos SET nombre = ?, periodo = ?, fecha_inicio = ?, fecha_fin = ?, activo = ? WHERE id = ?',
            [nombre, periodo, fecha_inicio, fecha_fin, activo ? 1 : 0, id]
        );
        
        await connection.query('DELETE FROM sorteos_camaras WHERE id_sorteo = ?', [id]);
        if (camaras && camaras.length > 0) {
            for (let cId of camaras) {
                await connection.query('INSERT INTO sorteos_camaras (id_sorteo, id_camara) VALUES (?, ?)', [id, cId]);
            }
        }
        await connection.commit();
        res.json({ message: 'Sorteo actualizado' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update status
app.put('/api/sorteos/:id/status', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    try {
        await pool.query('UPDATE sorteos SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
        res.json({ message: 'Estado del sorteo actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete sorteo
app.delete('/api/sorteos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sorteos WHERE id = ?', [id]);
        res.json({ message: 'Sorteo eliminado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get participantes of a sorteo
app.get('/api/sorteos/:id/participantes', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { camara_id } = req.query;
    try {
        let query = 'SELECT s.*, c.nombre as camara_nombre FROM sorteo s JOIN camara c ON s.id_camara = c.id WHERE s.id_sorteo = ?';
        let params = [id];
        if (camara_id) {
            query += ' AND s.id_camara = ?';
            params.push(camara_id);
        }
        query += ' ORDER BY s.fecha_registro DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Public: check active sorteo for a camera
app.get('/api/public/camaras/:id/sorteo-activo', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT s.* FROM sorteos s
            JOIN sorteos_camaras sc ON s.id = sc.id_sorteo
            WHERE sc.id_camara = ? AND s.activo = 1 
            AND CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin
            LIMIT 1
        `, [id]);
        if (rows.length > 0) {
            res.json({ activo: true, sorteo: rows[0] });
        } else {
            res.json({ activo: false });
        }
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Public: register participant
app.post('/api/public/sorteos/participar', async (req, res) => {
    const { id_sorteo, id_camara, apellido, nombre, domicilio, telefono } = req.body;
    try {
        await pool.query(
            'INSERT INTO sorteo (id_sorteo, id_camara, apellido, nombre, domicilio, telefono) VALUES (?, ?, ?, ?, ?, ?)',
            [id_sorteo, id_camara, apellido, nombre, domicilio, telefono]
        );
        res.status(201).json({ message: 'Participación registrada con éxito' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SECTOR ROUTES ---

// Get all sectors (public)
app.get('/api/sectores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sector ORDER BY orden, nombre');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create sector
app.post('/api/sectores', isAuthenticated, async (req, res) => {
    const { nombre, color, orden } = req.body;
    try {
        const [r] = await pool.query('INSERT INTO sector (nombre, color, orden) VALUES (?, ?, ?)', [nombre, color || '#0ea5e9', orden || 0]);
        res.status(201).json({ id: r.insertId, nombre, color, orden });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update sector
app.put('/api/sectores/:id', isAuthenticated, async (req, res) => {
    const { nombre, color, orden } = req.body;
    try {
        await pool.query('UPDATE sector SET nombre = ?, color = ?, orden = ? WHERE id = ?', [nombre, color || '#0ea5e9', orden || 0, req.params.id]);
        res.json({ message: 'Sector actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete sector
app.delete('/api/sectores/:id', isAuthenticated, async (req, res) => {
    try {
        await pool.query('DELETE FROM sector WHERE id = ?', [req.params.id]);
        res.json({ message: 'Sector eliminado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- LOCALIDADES CRUD ---

// Get all localities
app.get('/api/localidades', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM localidad ORDER BY nombre');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create locality
app.post('/api/localidades', isAuthenticated, async (req, res) => {
    const { nombre } = req.body;
    try {
        const [r] = await pool.query('INSERT INTO localidad (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: r.insertId, nombre });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update locality
app.put('/api/localidades/:id', isAuthenticated, async (req, res) => {
    const { nombre } = req.body;
    try {
        await pool.query('UPDATE localidad SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
        res.json({ message: 'Localidad actualizada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete locality
app.delete('/api/localidades/:id', isAuthenticated, async (req, res) => {
    try {
        await pool.query('DELETE FROM localidad WHERE id = ?', [req.params.id]);
        res.json({ message: 'Localidad eliminada' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- CAMARAS CRUD ---
app.get('/api/camaras', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM camara ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/camaras', isAuthenticated, async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    let sigla = null;
    const match = nombre.trim().match(/^\(([A-Za-z0-9_-]+)\)/);
    if (match) sigla = match[1];
    try {
        const [r] = await pool.query('INSERT INTO camara (nombre, sigla) VALUES (?, ?)', [nombre, sigla]);
        res.json({ id: r.insertId, nombre, sigla });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/camaras/:id', isAuthenticated, async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    let sigla = null;
    const match = nombre.trim().match(/^\(([A-Za-z0-9_-]+)\)/);
    if (match) sigla = match[1];
    try {
        await pool.query('UPDATE camara SET nombre = ?, sigla = COALESCE(?, sigla) WHERE id = ?', [nombre, sigla, req.params.id]);
        res.json({ message: 'Camara actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/camaras/:id', isAuthenticated, async (req, res) => {
    try {
        await pool.query('DELETE FROM camara WHERE id = ?', [req.params.id]);
        res.json({ message: 'Camara eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Delete section
app.delete('/api/secciones/:id', isAuthenticated, async (req, res) => {
    try {
        await pool.query('DELETE FROM seccion WHERE id = ?', [req.params.id]);
        res.json({ message: 'Sección eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all survey periods (Filtered by survey)
app.get('/api/periodos', async (req, res) => {
    try {
        const { encuesta_id } = req.query;
        let query = 'SELECT * FROM encuesta_periodo';
        let params = [];
        if (encuesta_id) {
            query += ' WHERE encuesta_id = ?';
            params.push(encuesta_id);
        }
        query += ' ORDER BY anio DESC, mes DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new period
app.post('/api/periodos', isAuthenticated, async (req, res) => {
    const { mes, anio, encuesta_id, fecha_apertura, fecha_cierre } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO encuesta_periodo (mes, anio, encuesta_id, fecha_apertura, fecha_cierre) VALUES (?, ?, ?, ?, ?)',
            [mes, anio, encuesta_id, fecha_apertura || null, fecha_cierre || null]
        );
        res.status(201).json({ id: result.insertId, mes, anio, encuesta_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete period (and its responses)
app.delete('/api/periodos/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Delete responses linked to this period
        await connection.query('DELETE FROM respuesta WHERE encuesta_periodo_id = ?', [id]);
        
        // 2. Delete the period itself
        const [result] = await connection.query('DELETE FROM encuesta_periodo WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            throw new Error('Periodo no encontrado');
        }

        await connection.commit();
        res.json({ message: 'Periodo y sus respuestas eliminados correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get auxiliary data for selectors (localidades remain)
app.get('/api/aux/data', async (req, res) => {
    try {
        const [localidades] = await pool.query('SELECT * FROM localidad ORDER BY nombre');
        const [camaras] = await pool.query('SELECT * FROM camara ORDER BY nombre');
        const [ivas] = await pool.query('SELECT * FROM situacion_iva ORDER BY nombre');
        const [rubros] = await pool.query('SELECT * FROM rubro ORDER BY nombre');
        res.json({ localidades, camaras, ivas, rubros });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SURVEY-QUESTION LINKING ---

// Link existing question to survey
app.post('/api/encuestas/:id/vincular-pregunta', isAuthenticated, async (req, res) => {
    const { pregunta_id, seccion_id, orden } = req.body;
    try {
        await pool.query(
            'INSERT INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE seccion_id = ?, orden = ?',
            [req.params.id, pregunta_id, seccion_id || null, orden || 0, seccion_id || null, orden || 0]
        );
        res.json({ message: 'Pregunta vinculada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unlink question from survey (doesn't delete from bank)
app.delete('/api/encuestas/:id/desvincular-pregunta/:pregunta_id', isAuthenticated, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM encuesta_pregunta WHERE encuesta_id = ? AND pregunta_id = ?',
            [req.params.id, req.params.pregunta_id]
        );
        res.json({ message: 'Pregunta desvinculada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- QUESTION MANAGEMENT ROUTES ---

// Create new question (automatically link to survey if provided)
app.post('/api/preguntas', isAuthenticated, async (req, res) => {
    const { texto_pregunta, tipo, encuesta_id, orden, camara_id, seccion_id, categoria } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [resP] = await connection.query(
            'INSERT INTO pregunta (texto_pregunta, tipo, orden, categoria) VALUES (?, ?, ?, ?)',
            [texto_pregunta, tipo, orden || 0, categoria || null]
        );
        const pId = resP.insertId;
        
        if (encuesta_id) {
            await connection.query(
                'INSERT INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden) VALUES (?, ?, ?, ?)',
                [encuesta_id, pId, seccion_id || null, orden || 0]
            );
        }
        
        await connection.commit();
        res.status(201).json({ id: pId, texto_pregunta, tipo, encuesta_id, orden, seccion_id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update question
app.put('/api/preguntas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { texto_pregunta, tipo, orden, seccion_id, categoria } = req.body;
    try {
        await pool.query(
            'UPDATE pregunta SET texto_pregunta = ?, tipo = ?, orden = ?, seccion_id = ?, categoria = ? WHERE id = ?',
            [texto_pregunta, tipo, orden, seccion_id || null, categoria || null, id]
        );
        res.json({ message: 'Pregunta actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete question (Hard delete from bank and all surveys)
app.delete('/api/preguntas/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Clear references
        await connection.query('UPDATE opcion SET siguiente_seccion_id = NULL WHERE siguiente_seccion_id = ?', [id]).catch(() => {});
        await connection.query('DELETE FROM encuesta_pregunta WHERE pregunta_id = ?', [id]);
        await connection.query('DELETE FROM respuesta WHERE pregunta_id = ?', [id]);
        await connection.query('DELETE FROM opcion WHERE pregunta_id = ?', [id]);
        await connection.query('DELETE FROM pregunta WHERE id = ?', [id]);
        await connection.commit();
        res.json({ message: 'Pregunta eliminada permanentemente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Create/Update options for a question
app.post('/api/preguntas/:id/opciones', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { opciones } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Disconnect respuestas from opciones before deleting to avoid foreign key error
        await connection.query('UPDATE respuesta SET opcion_id = NULL WHERE pregunta_id = ?', [id]);
        await connection.query('DELETE FROM opcion WHERE pregunta_id = ?', [id]);
        for (const opt of opciones) {
            await connection.query(
                'INSERT INTO opcion (pregunta_id, texto_opcion, valor, siguiente_seccion_id) VALUES (?, ?, ?, ?)',
                [id, opt.texto, opt.valor !== undefined ? opt.valor : null, opt.siguiente_seccion_id || null]
            );
        }
        await connection.commit();
        res.json({ message: 'Opciones actualizadas correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get all questions for a specific survey
app.get('/api/preguntas', async (req, res) => {
    try {
        const { encuesta_id } = req.query;
        if (!encuesta_id) return res.status(400).json({ error: 'encuesta_id requerido' });

        let query = `
            SELECT p.*, ep.seccion_id, ep.orden,
                   GROUP_CONCAT(o.texto_opcion ORDER BY o.id SEPARATOR '|||') as opciones_textos,
                   GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR '|||') as opciones_ids,
                   GROUP_CONCAT(COALESCE(o.valor, 'NULL_VAL') ORDER BY o.id SEPARATOR '|||') as opciones_valores,
                   GROUP_CONCAT(COALESCE(o.siguiente_seccion_id, '') ORDER BY o.id SEPARATOR '|||') as opciones_saltos
            FROM pregunta p 
            JOIN encuesta_pregunta ep ON p.id = ep.pregunta_id
            LEFT JOIN opcion o ON p.id = o.pregunta_id
            WHERE ep.encuesta_id = ?
            GROUP BY p.id ORDER BY ep.seccion_id, ep.orden, p.id
        `;
        const [rows] = await pool.query(query, [encuesta_id]);
        let formatted = rows.map(r => ({
            ...r,
            opciones: (r.opciones_textos ? r.opciones_textos.split('|||') : []).map((t, i) => ({
                id: r.opciones_ids.split('|||')[i] ? Number(r.opciones_ids.split('|||')[i]) : null,
                texto: t,
                valor: r.opciones_valores.split('|||')[i] === 'NULL_VAL' ? null : Number(r.opciones_valores.split('|||')[i]),
                siguiente_seccion_id: r.opciones_saltos.split('|||')[i] ? Number(r.opciones_saltos.split('|||')[i]) : null
            })).filter(o => o.id !== null)
        }));

        // For selector_rubro questions: auto-generate options from sector table linked to secciones
        const selectorRubroQuestions = formatted.filter(q => q.tipo === 'selector_rubro');
        if (selectorRubroQuestions.length > 0) {
            const [sectores] = await pool.query(`
                SELECT s.id as sector_id, s.nombre, s.color, sec.id as seccion_id
                FROM sector s
                LEFT JOIN seccion sec ON sec.sector_id = s.id AND sec.encuesta_id = ?
                ORDER BY s.orden, s.nombre
            `, [encuesta_id]);

            formatted = formatted.map(q => {
                if (q.tipo !== 'selector_rubro') return q;
                return {
                    ...q,
                    opciones: sectores.map(s => ({
                        id: s.sector_id,
                        texto: s.nombre,
                        sector_id: s.sector_id,
                        color: s.color,
                        siguiente_seccion_id: s.seccion_id || null,
                        valor: null
                    }))
                };
            });
        }

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STATS ---

app.get('/api/stats/:periodo_id', isAuthenticated, async (req, res) => {
    try {
        const { periodo_id } = req.params;
        const { localidad_id, seccion_id } = req.query;
        
        let totalQuery = 'SELECT COUNT(*) as total FROM (SELECT DISTINCT fecha_respuesta, localidad_id FROM respuesta WHERE encuesta_periodo_id = ?';
        let statsQuery = `SELECT r.pregunta_id, p.texto_pregunta, p.tipo, p.seccion_id, 
                                o.texto_opcion, r.valor_texto,
                                COALESCE(r.sector_id, sec.sector_id) as sector_id, s.nombre as sector_nombre, s.color as sector_color,
                                COUNT(*) as count, AVG(r.valor_numerico) as promedio
                         FROM respuesta r
                         JOIN pregunta p ON r.pregunta_id = p.id
                         LEFT JOIN seccion sec ON p.seccion_id = sec.id
                         LEFT JOIN opcion o ON r.opcion_id = o.id
                         LEFT JOIN sector s ON s.id = COALESCE(r.sector_id, sec.sector_id)
                         WHERE r.encuesta_periodo_id = ?`;
        
        const params = [periodo_id];
        const statsParams = [periodo_id];

        if (localidad_id) {
            totalQuery += ' AND localidad_id = ?';
            statsQuery += ' AND r.localidad_id = ?';
            params.push(localidad_id);
            statsParams.push(localidad_id);
        }

        if (seccion_id) {
            statsQuery += ' AND p.seccion_id = ?';
            statsParams.push(seccion_id);
        }

        const { sector_id } = req.query;
        if (sector_id) {
            statsQuery += ' AND r.sector_id = ?';
            statsParams.push(sector_id);
        }
        
        totalQuery += ') as sub';
        statsQuery += ' GROUP BY r.pregunta_id, o.id, r.valor_texto, COALESCE(r.sector_id, sec.sector_id)';

        const [totalResponses] = await pool.query(totalQuery, params);
        const [answers] = await pool.query(statsQuery, statsParams);

        // Sector distribution (full, not filtered by sector)
        const [sectorRows] = await pool.query(`
            SELECT r.sector_id, s.nombre, s.color, COUNT(DISTINCT r.fecha_respuesta, r.localidad_id) as count
            FROM respuesta r
            JOIN sector s ON r.sector_id = s.id
            WHERE r.encuesta_periodo_id = ?
            AND r.sector_id IS NOT NULL
            GROUP BY r.sector_id, s.nombre, s.color
            ORDER BY s.orden
        `, [periodo_id]);

        // 4. IVA / Régimen laboral - Estrategia dual
        let ivaStats = [];
        let debugIva = {};

        // --- ENFOQUE A: Preguntas numéricas de personal (producción) ---
        const [monoQRows] = await pool.query(`
            SELECT id FROM pregunta 
            WHERE (texto_pregunta LIKE '%Monotributista%' OR texto_pregunta LIKE '%Monotributo%')
              AND tipo IN ('numero', 'numerico')
        `);
        const [riQRows] = await pool.query(`
            SELECT id FROM pregunta 
            WHERE (texto_pregunta LIKE '%Resp. Inscripto%' OR texto_pregunta LIKE '%Responsable Inscripto%' OR texto_pregunta LIKE '%R. Inscripto%')
              AND tipo IN ('numero', 'numerico')
        `);

        const monoIds = monoQRows.map(r => r.id);
        const riIds = riQRows.map(r => r.id);

        if (monoIds.length > 0 && riIds.length > 0) {
            // Enfoque numérico
            const monoPlaceholders = monoIds.map(() => '?').join(',');
            const riPlaceholders = riIds.map(() => '?').join(',');
            let localFilter = localidad_id ? ' AND r.localidad_id = ?' : '';

            const [rowsMono] = await pool.query(`
                SELECT 'Monotributista' AS iva_status, s.id AS sector_id, s.nombre AS sector_nombre, s.color AS sector_color, COUNT(*) AS count
                FROM respuesta r JOIN sector s ON r.sector_id = s.id
                WHERE r.encuesta_periodo_id = ? AND r.pregunta_id IN (${monoPlaceholders}) AND r.valor_numerico > 0 AND r.sector_id IS NOT NULL ${localFilter}
                GROUP BY s.id, s.nombre, s.color
            `, [periodo_id, ...monoIds, ...(localidad_id ? [localidad_id] : [])]);

            const [rowsRI] = await pool.query(`
                SELECT 'Responsable Inscripto' AS iva_status, s.id AS sector_id, s.nombre AS sector_nombre, s.color AS sector_color, COUNT(*) AS count
                FROM respuesta r JOIN sector s ON r.sector_id = s.id
                WHERE r.encuesta_periodo_id = ? AND r.pregunta_id IN (${riPlaceholders}) AND r.valor_numerico > 0 AND r.sector_id IS NOT NULL ${localFilter}
                GROUP BY s.id, s.nombre, s.color
            `, [periodo_id, ...riIds, ...(localidad_id ? [localidad_id] : [])]);

            ivaStats = [...rowsMono, ...rowsRI];
            debugIva = { method: 'numeric', mono_pregunta_ids: monoIds, ri_pregunta_ids: riIds, mono_filas: rowsMono.length, ri_filas: rowsRI.length, iva_pregunta_id: monoIds[0] };
        } else {
            // --- ENFOQUE B: Pregunta categórica de IVA (fallback para dev/local) ---
            // Buscar por opciones que tengan Monotribut/Inscripto
            const [ivaQByOption] = await pool.query(`
                SELECT p.id FROM pregunta p 
                JOIN opcion o ON o.pregunta_id = p.id 
                WHERE o.texto_opcion LIKE '%Monotribut%' OR o.texto_opcion LIKE '%Inscripto%' 
                LIMIT 1
            `);
            let ivaPreguntaId = ivaQByOption.length > 0 ? ivaQByOption[0].id : null;

            if (!ivaPreguntaId) {
                // Fallback: buscar por texto de pregunta con IVA (case-sensitive para evitar falsos positivos)
                const [ivaQByText] = await pool.query(`
                    SELECT id FROM pregunta 
                    WHERE (texto_pregunta LIKE BINARY '%IVA%' OR texto_pregunta LIKE BINARY '%I.V.A.%')
                      AND texto_pregunta NOT LIKE '%Química%' 
                      AND texto_pregunta NOT LIKE '%Quimica%' 
                      AND texto_pregunta NOT LIKE '%productiva%' 
                      AND texto_pregunta NOT LIKE '%productivo%' 
                      AND texto_pregunta NOT LIKE '%derivados%'
                    LIMIT 1
                `);
                ivaPreguntaId = ivaQByText.length > 0 ? ivaQByText[0].id : null;
            }

            let debugTotal = 0;
            let debugSector = 0;

            if (ivaPreguntaId) {
                let sqlIva = `
                    SELECT 
                        COALESCE(o.texto_opcion, r.valor_texto) AS iva_status,
                        s.id AS sector_id,
                        s.nombre AS sector_nombre,
                        s.color AS sector_color,
                        COUNT(*) AS count
                    FROM respuesta r
                    LEFT JOIN opcion o ON r.opcion_id = o.id
                    LEFT JOIN sector s ON r.sector_id = s.id
                    WHERE r.encuesta_periodo_id = ?
                      AND r.pregunta_id = ?
                      AND COALESCE(o.texto_opcion, r.valor_texto) IS NOT NULL
                      AND r.sector_id IS NOT NULL
                `;
                const paramsIva = [periodo_id, ivaPreguntaId];
                if (localidad_id) {
                    sqlIva += ' AND r.localidad_id = ?';
                    paramsIva.push(localidad_id);
                }
                sqlIva += ' GROUP BY iva_status, s.id, s.nombre, s.color ORDER BY iva_status, s.orden';
                
                const [ivaRows] = await pool.query(sqlIva, paramsIva);
                ivaStats = ivaRows;

                const [dtRows] = await pool.query('SELECT COUNT(*) as total FROM respuesta WHERE encuesta_periodo_id = ? AND pregunta_id = ?', [periodo_id, ivaPreguntaId]);
                debugTotal = dtRows[0].total;
                const [dsRows] = await pool.query('SELECT COUNT(*) as total FROM respuesta WHERE encuesta_periodo_id = ? AND pregunta_id = ? AND sector_id IS NOT NULL', [periodo_id, ivaPreguntaId]);
                debugSector = dsRows[0].total;
            }

            debugIva = { method: 'categorical', iva_pregunta_id: ivaPreguntaId, respuestas_iva_total: debugTotal, respuestas_iva_con_sector: debugSector };
        }

        // 5. Camara Distribution
        let camaraStats = [];
        const [camaraQRows] = await pool.query(`SELECT id FROM pregunta WHERE tipo = 'selector_camara' LIMIT 1`);
        if (camaraQRows.length > 0) {
            const camaraPreguntaId = camaraQRows[0].id;
            let sqlCamara = `
                SELECT 
                    c.id AS camara_id,
                    c.nombre AS camara_nombre,
                    s.id AS sector_id,
                    s.nombre AS sector_nombre,
                    s.color AS sector_color,
                    COUNT(DISTINCT r.fecha_respuesta) AS \`count\`
                FROM respuesta r
                JOIN camara c ON CAST(r.valor_numerico AS UNSIGNED) = c.id
                LEFT JOIN sector s ON r.sector_id = s.id
                WHERE r.encuesta_periodo_id = ?
                  AND r.pregunta_id = ?
                  AND r.valor_numerico IS NOT NULL
            `;
            const paramsCamara = [periodo_id, camaraPreguntaId];
            if (localidad_id) { sqlCamara += ' AND r.localidad_id = ?'; paramsCamara.push(localidad_id); }
            if (sector_id) { sqlCamara += ' AND r.sector_id = ?'; paramsCamara.push(sector_id); }
            sqlCamara += ' GROUP BY c.id, c.nombre, s.id, s.nombre, s.color ORDER BY count DESC, s.orden';
            const [camaraRows] = await pool.query(sqlCamara, paramsCamara);
            camaraStats = camaraRows;
        }

        // 6. Localidad Distribution WITH Socio / No Socio
        let localidadStats = [];
        let sqlLoc = '';
        let paramsLoc = [];
        if (camaraQRows.length > 0) {
            const camaraPreguntaId = camaraQRows[0].id;
            sqlLoc = `
                SELECT 
                    l.id as localidad_id, 
                    l.nombre as localidad_nombre, 
                    s.nombre as sector_nombre,
                    COUNT(DISTINCT r.fecha_respuesta) as count,
                    COUNT(DISTINCT CASE WHEN soc.fecha_respuesta IS NOT NULL THEN r.fecha_respuesta END) as socios,
                    COUNT(DISTINCT CASE WHEN soc.fecha_respuesta IS NOT NULL THEN r.fecha_respuesta END) as socios_count,
                    COUNT(DISTINCT CASE WHEN soc.fecha_respuesta IS NULL THEN r.fecha_respuesta END) as no_socios,
                    COUNT(DISTINCT CASE WHEN soc.fecha_respuesta IS NULL THEN r.fecha_respuesta END) as no_socios_count
                FROM respuesta r
                JOIN localidad l ON r.localidad_id = l.id
                LEFT JOIN sector s ON r.sector_id = s.id
                LEFT JOIN (
                    SELECT DISTINCT r_soc.localidad_id, r_soc.fecha_respuesta
                    FROM respuesta r_soc
                    JOIN camara c ON (
                        (r_soc.valor_numerico IS NOT NULL AND CAST(r_soc.valor_numerico AS UNSIGNED) = c.id)
                        OR (r_soc.valor_texto IS NOT NULL AND CAST(r_soc.valor_texto AS UNSIGNED) = c.id)
                        OR (r_soc.valor_texto IS NOT NULL AND LOWER(TRIM(r_soc.valor_texto)) = LOWER(TRIM(c.nombre)))
                        OR (r_soc.opcion_id IS NOT NULL AND (
                            SELECT LOWER(TRIM(o_c.texto_opcion)) FROM opcion o_c WHERE r_soc.opcion_id = o_c.id
                        ) = LOWER(TRIM(c.nombre)))
                    )
                    WHERE r_soc.encuesta_periodo_id = ?
                      AND r_soc.pregunta_id = ?
                      AND (r_soc.valor_texto IS NULL OR r_soc.valor_texto NOT LIKE '%No pertenezco%')
                ) soc ON soc.localidad_id = r.localidad_id 
                     AND ABS(TIMESTAMPDIFF(SECOND, soc.fecha_respuesta, r.fecha_respuesta)) <= 20
                WHERE r.encuesta_periodo_id = ?
            `;
            paramsLoc = [periodo_id, camaraPreguntaId, periodo_id];
        } else {
            sqlLoc = `
                SELECT 
                    l.id as localidad_id, 
                    l.nombre as localidad_nombre, 
                    s.nombre as sector_nombre,
                    COUNT(DISTINCT r.fecha_respuesta) as count,
                    0 as socios,
                    0 as socios_count,
                    COUNT(DISTINCT r.fecha_respuesta) as no_socios,
                    COUNT(DISTINCT r.fecha_respuesta) as no_socios_count
                FROM respuesta r
                JOIN localidad l ON r.localidad_id = l.id
                LEFT JOIN sector s ON r.sector_id = s.id
                WHERE r.encuesta_periodo_id = ?
            `;
            paramsLoc = [periodo_id];
        }
        if (sector_id) { sqlLoc += ' AND r.sector_id = ?'; paramsLoc.push(sector_id); }
        sqlLoc += ' GROUP BY l.id, l.nombre, s.nombre ORDER BY count DESC';
        const [locRows] = await pool.query(sqlLoc, paramsLoc);
        localidadStats = locRows;

        res.json({
            total: totalResponses[0].total,
            answers: answers,
            sectorDistribution: sectorRows,
            camaraStats: camaraStats,
            localidadStats: localidadStats,
            ivaStats: ivaStats,
            _debug_iva: debugIva
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats-historical/:encuesta_id/:pregunta_id', isAuthenticated, async (req, res) => {
    try {
        const { encuesta_id, pregunta_id } = req.params;
        const { sector_id, localidad_id } = req.query;
        
        console.log(`Historical Stats Request: Survey ${encuesta_id}, Question ${pregunta_id}, Sector ${sector_id}`);

        let query = `
            SELECT ep.id as periodo_id, ep.mes, ep.anio,
                   o.texto_opcion, 
                   AVG(r.valor_numerico) as avg_value,
                   COUNT(r.id) as count
            FROM encuesta_periodo ep
            JOIN respuesta r ON r.encuesta_periodo_id = ep.id
            LEFT JOIN opcion o ON r.opcion_id = o.id
            WHERE ep.encuesta_id = ? AND r.pregunta_id = ?
        `;
        
        const params = [encuesta_id, pregunta_id];
        
        if (sector_id && sector_id !== 'null') {
            query += ' AND r.sector_id = ?';
            params.push(sector_id);
        }
        if (localidad_id && localidad_id !== '') {
            query += ' AND r.localidad_id = ?';
            params.push(localidad_id);
        }
        
        query += ' GROUP BY ep.id, o.id ORDER BY ep.anio ASC, ep.mes ASC';
        
        const [rows] = await pool.query(query, params);
        console.log(`Historical data found: ${rows.length} rows`);
        res.json(rows);
    } catch (error) {
        console.error('Historical Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// TREND IMAGE UPLOAD (solo para encuestas cerradas)
app.post('/api/trend-image/:encuesta_id/:pregunta_id', isAuthenticated, (req, res, next) => {
    uploadTrend.single('image')(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: 'Error al subir archivo: ' + err.message });
            }
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ninguna imagen' });
        }
        try {
            const { encuesta_id, pregunta_id } = req.params;
            const sector_id = req.body.sector_id || null;
            // Verificar que la encuesta esté cerrada
            const [enc] = await pool.query('SELECT estado FROM encuesta WHERE id = ?', [encuesta_id]);
            if (enc.length === 0) return res.status(404).json({ error: 'Encuesta no encontrada' });
            if (enc[0].estado !== 0) return res.status(403).json({ error: 'Solo se pueden subir imágenes en encuestas cerradas' });

            const imagenPath = '/uploads/trends/' + req.file.filename;
            // Upsert with sector_id
            await pool.query(
                'INSERT INTO tendencia_imagen (encuesta_id, pregunta_id, sector_id, imagen_path, fecha_subida) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE imagen_path = ?, fecha_subida = NOW()',
                [encuesta_id, pregunta_id, sector_id, imagenPath, imagenPath]
            );
            res.json({ success: true, imagen_path: imagenPath, sector_id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

// GET trend image(s) - if sector_id provided, get sector-specific; otherwise get general or all
app.get('/api/trend-image/:encuesta_id/:pregunta_id', isAuthenticated, async (req, res) => {
    try {
        const { encuesta_id, pregunta_id } = req.params;
        const { sector_id } = req.query;
        let rows;
        if (sector_id) {
            [rows] = await pool.query(
                'SELECT * FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ? AND sector_id = ?',
                [encuesta_id, pregunta_id, sector_id]
            );
        } else {
            [rows] = await pool.query(
                'SELECT * FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ? ORDER BY sector_id IS NULL, sector_id',
                [encuesta_id, pregunta_id]
            );
        }
        if (rows.length === 0) return res.json(null);
        // Return single object if only one, otherwise array
        res.json(sector_id ? rows[0] : (rows.length === 1 ? rows[0] : rows));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE trend image
app.delete('/api/trend-image/:encuesta_id/:pregunta_id', isAuthenticated, async (req, res) => {
    try {
        const { encuesta_id, pregunta_id } = req.params;
        const { sector_id } = req.query;
        let rows;
        if (sector_id) {
            [rows] = await pool.query(
                'SELECT * FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ? AND sector_id = ?',
                [encuesta_id, pregunta_id, sector_id]
            );
        } else {
            [rows] = await pool.query(
                'SELECT * FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ?',
                [encuesta_id, pregunta_id]
            );
        }
        for (const row of rows) {
            const filePath = path.join(__dirname, '../public', row.imagen_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        if (sector_id) {
            await pool.query('DELETE FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ? AND sector_id = ?',
                [encuesta_id, pregunta_id, sector_id]);
        } else {
            await pool.query('DELETE FROM tendencia_imagen WHERE encuesta_id = ? AND pregunta_id = ?',
                [encuesta_id, pregunta_id]);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// STATS PIVOT (Constructor Dinámico de Gráficos Cruzados)
app.get('/api/stats-pivot/:id', isAuthenticated, async (req, res) => {
    try {
        const { id: periodo_id } = req.params;
        const { base_pregunta_id, cross_pregunta_id, localidad_id, sector_nombre } = req.query;

        if (!base_pregunta_id || !cross_pregunta_id) {
            return res.status(400).json({ error: 'Faltan parámetros de cruce (base_pregunta_id, cross_pregunta_id)' });
        }

        let sqlPivot = '';
        let paramsPivot = [];

        if (cross_pregunta_id === 'sector') {
            // Pivot by Sector
            sqlPivot = `
                SELECT 
                    p_base.id as base_pregunta_id,
                    COALESCE(r_base.valor_texto, opt_base.texto_opcion) as base_categoria,
                    'sector' as cross_pregunta_id,
                    s.nombre as cross_categoria,
                    s.color as cross_color,
                    COUNT(DISTINCT r_base.id) as cantidad,
                    AVG(r_base.valor_numerico) as promedio_base
                FROM respuesta r_base
                JOIN pregunta p_base ON r_base.pregunta_id = p_base.id
                LEFT JOIN opcion opt_base ON r_base.opcion_id = opt_base.id
                LEFT JOIN seccion sec ON p_base.seccion_id = sec.id
                JOIN sector s ON COALESCE(r_base.sector_id, sec.sector_id) = s.id
                WHERE r_base.encuesta_periodo_id = ?
                  AND p_base.id = ?
                  AND COALESCE(r_base.valor_texto, opt_base.texto_opcion) IS NOT NULL
                  AND COALESCE(r_base.sector_id, sec.sector_id) IS NOT NULL
            `;
            paramsPivot = [periodo_id, base_pregunta_id];

            if (localidad_id) {
                sqlPivot += ' AND r_base.localidad_id = ?';
                paramsPivot.push(localidad_id);
            }

            sqlPivot += ' GROUP BY base_categoria, s.id, s.nombre, s.color ORDER BY base_categoria, s.orden';

        } else {
            // Pivot by another Question
            sqlPivot = `
                SELECT 
                    p_base.id as base_pregunta_id,
                    COALESCE(r_base.valor_texto, opt_base.texto_opcion) as base_categoria,
                    p_cross.id as cross_pregunta_id,
                    COALESCE(r_cross.valor_texto, opt_cross.texto_opcion) as cross_categoria,
                    NULL as cross_color,
                    COUNT(DISTINCT r_base.id) as cantidad,
                    AVG(r_base.valor_numerico) as promedio_base,
                    COALESCE(s.id, rubro_sector.sector_id) as sector_id,
                    COALESCE(s.nombre, rubro_sector.sector_nombre) as sector_nombre
                FROM respuesta r_base
                JOIN pregunta p_base ON r_base.pregunta_id = p_base.id
                LEFT JOIN opcion opt_base ON r_base.opcion_id = opt_base.id
                JOIN respuesta r_cross ON r_base.encuesta_periodo_id = r_cross.encuesta_periodo_id 
                    AND r_base.localidad_id = r_cross.localidad_id
                    AND r_base.fecha_respuesta = r_cross.fecha_respuesta
                JOIN pregunta p_cross ON r_cross.pregunta_id = p_cross.id
                LEFT JOIN opcion opt_cross ON r_cross.opcion_id = opt_cross.id
                LEFT JOIN seccion sec ON p_base.seccion_id = sec.id
                LEFT JOIN sector s ON s.id = COALESCE(r_base.sector_id, sec.sector_id)
                LEFT JOIN (
                    SELECT r_sub.encuesta_periodo_id, r_sub.localidad_id, r_sub.fecha_respuesta,
                           s_sub.id as sector_id, s_sub.nombre as sector_nombre
                    FROM respuesta r_sub
                    JOIN opcion o_sub ON r_sub.opcion_id = o_sub.id AND o_sub.siguiente_seccion_id IS NOT NULL
                    JOIN sector s_sub ON 
                        LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                            o_sub.texto_opcion, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U')))
                        =
                        LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                            s_sub.nombre, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U')))
                    GROUP BY r_sub.encuesta_periodo_id, r_sub.localidad_id, r_sub.fecha_respuesta, s_sub.id, s_sub.nombre
                ) rubro_sector ON rubro_sector.encuesta_periodo_id = r_base.encuesta_periodo_id
                    AND rubro_sector.localidad_id = r_base.localidad_id
                    AND rubro_sector.fecha_respuesta = r_base.fecha_respuesta
                WHERE r_base.encuesta_periodo_id = ?
                  AND p_base.id = ?
                  AND p_cross.id = ?
                  AND COALESCE(r_base.valor_texto, opt_base.texto_opcion) IS NOT NULL
                  AND COALESCE(r_cross.valor_texto, opt_cross.texto_opcion) IS NOT NULL
            `;
            paramsPivot = [periodo_id, base_pregunta_id, cross_pregunta_id];

            if (localidad_id) {
                sqlPivot += ' AND r_base.localidad_id = ?';
                paramsPivot.push(localidad_id);
            }

            if (sector_nombre) {
                sqlPivot += ' AND COALESCE(s.nombre, rubro_sector.sector_nombre) = ?';
                paramsPivot.push(sector_nombre);
            }

            sqlPivot += ' GROUP BY base_categoria, cross_categoria, COALESCE(s.id, rubro_sector.sector_id), COALESCE(s.nombre, rubro_sector.sector_nombre) ORDER BY base_categoria, cross_categoria';
        }

        const [rows] = await pool.query(sqlPivot, paramsPivot);
        res.json(rows);
    } catch (error) {
        console.error('Pivot Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- DATA IMPORT ---

app.post('/api/import/upload_batch', isAuthenticated, async (req, res) => {
    const { filename, total_rows, batch_index, rows } = req.body;
    let { import_id } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        if (!import_id && batch_index === 0) {
            const [result] = await connection.query(
                'INSERT INTO import_history (filename, total_rows, imported_by) VALUES (?, ?, ?)',
                [filename, total_rows, req.session.user.id]
            );
            import_id = result.insertId;
        }
        
        if (!import_id) throw new Error('No import_id provided');
        
        for (const row of rows) {
            await connection.query(
                "INSERT INTO temp_import_data (import_id, row_number, raw_data, status) VALUES (?, ?, ?, 'pendiente')",
                [import_id, row.index, JSON.stringify(row.data)]
            );
        }
        
        await connection.commit();
        res.json({ message: 'Lote subido', import_id });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.post('/api/import/commit', isAuthenticated, async (req, res) => {
    const { import_id, encuesta_id, periodo_id } = req.body;
    try {
        if (!import_id || !encuesta_id || !periodo_id) {
            throw new Error('Faltan parámetros requeridos (import_id, encuesta_id, periodo_id)');
        }
        
        // 1. Obtener todas las filas pendientes
        const [tempRows] = await pool.query("SELECT * FROM temp_import_data WHERE import_id = ? AND status = 'pendiente'", [import_id]);
        if (tempRows.length === 0) {
            throw new Error('No hay datos pendientes para importar en este lote');
        }

        // 2. Cargar Lookups (preguntas, opciones, localidades)
        const [localidades] = await pool.query('SELECT id, nombre FROM localidad');
        const [preguntas] = await pool.query('SELECT id, texto_pregunta FROM pregunta WHERE encuesta_id = ?', [encuesta_id]);
        const [opciones] = await pool.query('SELECT id, pregunta_id, texto_opcion FROM opcion');

        // Función Helper de Fecha
        function getExcelDate(excelDate) {
            if (!excelDate) return null;
            if (typeof excelDate === 'number') {
                const d = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
                return d.toISOString().slice(0, 19).replace('T', ' ');
            }
            return String(excelDate);
        }

        // Auto-create missing questions
        const columnQuestions = {};
        const skipCols = ['id_respuesta', 'fecha_respuesta', 'anio', 'mes', 'periodo', 'situacion_iva', 'situación ante iva', 'localidad', 'camara', 'cámara a la que pertenece', 'rubro', 'sub_rubro', 'actividad', 'mov_nivel', 'marca temporal', 'marca_temporal', 'nivel_actividad'];
        
        const firstRowData = typeof tempRows[0].raw_data === 'string' ? JSON.parse(tempRows[0].raw_data) : tempRows[0].raw_data;
        const headers = Object.keys(firstRowData);

        for (const col of headers) {
            if (!col || skipCols.includes(col.toLowerCase())) continue;
            let q = preguntas.find(p => p.texto_pregunta.toLowerCase() === col.toLowerCase());
            if (!q) {
                const [resQ] = await pool.query('INSERT INTO pregunta (texto_pregunta, tipo, encuesta_id, seccion_id, orden) VALUES (?, "abierta", ?, NULL, 99)', [col, encuesta_id]);
                columnQuestions[col] = resQ.insertId;
                preguntas.push({ id: resQ.insertId, texto_pregunta: col });
            } else {
                columnQuestions[col] = q.id;
            }
        }

        function findLocalidad(val) {
            if (!val) return null;
            const match = localidades.find(l => l.nombre.toLowerCase().trim() === String(val).toLowerCase().trim());
            return match ? match.id : null;
        }
        
        function findOpcion(preguntaId, val) {
            if (!val) return null;
            const strVal = String(val).toLowerCase().trim();
            const match = opciones.find(o => o.pregunta_id === preguntaId && o.texto_opcion.toLowerCase().trim().includes(strVal));
            return match ? match.id : null;
        }

        let importedCount = 0;

        // 3. Procesar y Mapear Filas
        for (const temp of tempRows) {
            const rowData = typeof temp.raw_data === 'string' ? JSON.parse(temp.raw_data) : temp.raw_data;
            
            const locVal = rowData.localidad || rowData.Localidad;
            const loc_id = findLocalidad(locVal);
            const rawFecha = rowData.fecha_respuesta || rowData.Marca_temporal || rowData['Marca temporal'];
            let fecha = getExcelDate(rawFecha) || new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Si la fecha es generada (no viene del excel), le sumamos milisegundos para que sea única
            if (!rawFecha) {
                const d = new Date();
                d.setMilliseconds(d.getMilliseconds() + (temp.id % 1000));
                fecha = d.toISOString().slice(0, 19).replace('T', ' ');
            }

            try {
                let sector_id = null;
                
                // Detect core questions dynamically
                const qRubro = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('rubro'));
                const qIva = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('iva'));
                const qCamara = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('camara') || p.texto_pregunta.toLowerCase().includes('cámara'));
                const qComercio = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('comercio'));
                const qServicio = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('servicio'));
                const qIndustria = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('industria'));
                const qTurismo = preguntas.find(p => p.texto_pregunta.toLowerCase().includes('turismo'));

                // Rubro / Sector
                const rubroVal = rowData.rubro || rowData.Rubro || rowData.sector || rowData.Sector;
                if (rubroVal) {
                    const rbLower = String(rubroVal).toLowerCase();
                    if (rbLower.includes('comercio')) sector_id = 1;
                    else if (rbLower.includes('servicio')) sector_id = 5;
                    else if (rbLower.includes('industria')) sector_id = 3;
                    else if (rbLower.includes('turismo')) sector_id = 4;
                    else if (rbLower.includes('produccion') || rbLower.includes('producción')) sector_id = 6;

                    if (qRubro) {
                        const op = findOpcion(qRubro.id, rubroVal);
                        if (op) {
                            await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id, sector_id, valor_texto) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                                [periodo_id, qRubro.id, op, fecha, loc_id, sector_id, String(rubroVal)]);
                        }
                    }
                }

                // Situacion IVA
                const ivaVal = rowData.situacion_iva || rowData['Situacion IVA'] || rowData['Situación ante IVA'];
                if (ivaVal && qIva) {
                    const op = findOpcion(qIva.id, ivaVal);
                    if (op) await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?)', [periodo_id, qIva.id, op, fecha, loc_id, sector_id]);
                }
                
                // Camara
                const camaraVal = rowData.camara || rowData.Camara || rowData['Cámara a la que pertenece'];
                if (camaraVal && qCamara) {
                    const cleanCamara = String(camaraVal).split('-')[1] || camaraVal;
                    const op = findOpcion(qCamara.id, cleanCamara);
                    if (op) await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?)', [periodo_id, qCamara.id, op, fecha, loc_id, sector_id]);
                }
                
                // Mov Nivel (cuadricula)
                const movVal = rowData.mov_nivel || rowData.Nivel_Actividad || rowData['Nivel de Actividad'];
                const subRubroVal = rowData.sub_rubro || rowData.Actividad || rowData['Actividad Principal'];
                if (movVal && subRubroVal) {
                    let pId = null;
                    if (sector_id === 1 && qComercio) pId = qComercio.id;
                    else if (sector_id === 5 && qServicio) pId = qServicio.id;
                    else if (sector_id === 3 && qIndustria) pId = qIndustria.id;
                    else if (sector_id === 4 && qTurismo) pId = qTurismo.id;
                    
                    if (pId) {
                        const op = findOpcion(pId, movVal);
                        if (op) {
                            await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, valor_texto, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [periodo_id, pId, op, String(subRubroVal), fecha, loc_id, sector_id]);
                        }
                    }
                }
                
                // Unmapped / other columns
                for (const col of headers) {
                    if (skipCols.includes(col.toLowerCase()) || !rowData[col]) continue;
                    const pId = columnQuestions[col];
                    if (pId) {
                        await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, valor_texto, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?)', [periodo_id, pId, String(rowData[col]), fecha, loc_id, sector_id]);
                    }
                }
                
                // Marcar como procesado
                await pool.query("UPDATE temp_import_data SET status = 'procesado' WHERE id = ?", [temp.id]);
                importedCount++;
            } catch (errRow) {
                console.error(`Error processing row ${temp.id}:`, errRow);
                await pool.query("UPDATE temp_import_data SET status = 'error' WHERE id = ?", [temp.id]);
            }
        }

        // Marcar el lote entero como completado
        await pool.query("UPDATE import_history SET status = 'completado', completed_at = NOW() WHERE id = ?", [import_id]);
        
        res.json({ message: `Importación completada. Se procesaron ${importedCount} registros exitosamente.` });
    } catch (error) {
        console.error('Import Commit Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save survey responses
app.post('/api/respuestas', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { localidad_id, periodo_id, respuestas, email } = req.body;
        
        if (!periodo_id || !respuestas || !respuestas.length) {
            throw new Error("Faltan datos requeridos (periodo o respuestas)");
        }
        
        // 1. Obtener mes y año del periodo
        const [periodData] = await connection.query('SELECT mes, anio FROM encuesta_periodo WHERE id = ?', [periodo_id]);
        if (!periodData.length) throw new Error("Periodo no encontrado");
        const { mes, anio } = periodData[0];

        // 2. Guardar log en la tabla nueva (respuestas_encuesta) - Email opcional
        await connection.query(
            'INSERT INTO respuestas_encuesta (respuestas, email, fecha, mes, año) VALUES (?, ?, NOW(), ?, ?)',
            [JSON.stringify(respuestas), email || null, mes, anio]
        );
        
        // 4. Guardar respuestas detalladas en la tabla original (respuesta)
        for (const ans of respuestas) {
            await connection.query(
                'INSERT INTO respuesta (encuesta_periodo_id, localidad_id, pregunta_id, opcion_id, valor_texto, valor_numerico, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    periodo_id,
                    localidad_id || null,
                    ans.pregunta_id,
                    ans.opcion_id || null,
                    ans.valor_texto || null,
                    ans.valor_numerico || null,
                    ans.sector_id || null
                ]
            );
        }
        
        await connection.commit();
        res.status(201).json({ message: 'Respuestas guardadas correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// --- OPEN GRAPH DYNAMIC PREVIEWS ---

// Root handle
app.get('/', async (req, res) => {
    try {
        const indexPath = path.join(__dirname, '../index.html');
        if (!fs.existsSync(indexPath)) return res.status(404).send('Frontend index not found.');
        
        let html = fs.readFileSync(indexPath, 'utf8');
        const host = req.get('host');
        const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
        const imageUrl = `${protocol}://${host}/logo.png`;

        html = html.replace(/{{TITLE}}/g, 'Encuestas Fasa')
                   .replace(/{{DESC}}/g, 'Sistema de Encuestas')
                   .replace(/{{IMAGE}}/g, imageUrl)
                   .replace(/{{URL}}/g, `${protocol}://${host}/`);
        
        res.send(html);
    } catch (error) {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

app.get('/encuesta/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT titulo, descripcion FROM encuesta WHERE id = ?', [id]);
        const survey = rows[0] || { titulo: 'Encuestas Fasa', descripcion: 'Sistema de Encuestas' };
        
        const indexPath = path.join(__dirname, '../index.html');
        if (!fs.existsSync(indexPath)) {
             return res.status(404).send('Frontend index not found. Build may be missing.');
        }
        
        let html = fs.readFileSync(indexPath, 'utf8');
        const host = req.get('host');
        const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
        const absoluteUrl = `${protocol}://${host}/encuesta/${id}`;
        const imageUrl = `${protocol}://${host}/logo.png`;

        // Inyección de Meta Tags
        html = html.replace(/{{TITLE}}/g, survey.titulo)
                   .replace(/{{DESC}}/g, survey.descripcion || 'Relevamiento Económico Social - Participación Ciudadana')
                   .replace(/{{IMAGE}}/g, imageUrl)
                   .replace(/{{URL}}/g, absoluteUrl);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving OG preview:', error);
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

// Version endpoint
const BUILD_VERSION = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
app.get('/api/version', (req, res) => {
    res.json({ version: BUILD_VERSION, build_time: new Date().toISOString() });
});

// Serve frontend public/dist assets (for images like logo.png)
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all for 404
app.use((req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});
