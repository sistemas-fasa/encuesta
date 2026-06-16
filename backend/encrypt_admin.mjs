import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function encryptAdmin() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    try {
        const hashedPassword = await bcrypt.hash('fasca', 10);
        await pool.query('UPDATE usuarios SET password = ? WHERE usuario = ?', [hashedPassword, 'admin']);
        console.log('Admin password encrypted successfully!');
    } catch (error) {
        console.error('Error encrypting password:', error.message);
    } finally {
        pool.end();
    }
}

encryptAdmin();
