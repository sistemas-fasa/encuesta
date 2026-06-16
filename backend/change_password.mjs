import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function changePassword() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'encuestas'
    });

    try {
        const newPassword = 'camara2026';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const [result] = await pool.query('UPDATE usuarios SET password = ? WHERE usuario = ?', [hashedPassword, 'admin']);
        
        if (result.affectedRows > 0) {
            console.log('✅ Contraseña de admin actualizada con éxito a: ' + newPassword);
        } else {
            console.log('❌ No se encontró el usuario "admin" o no hubo cambios.');
        }
    } catch (error) {
        console.error('❌ Error al actualizar la contraseña:', error.message);
    } finally {
        await pool.end();
    }
}

changePassword();
