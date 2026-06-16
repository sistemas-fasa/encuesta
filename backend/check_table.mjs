import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function checkTable() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'encuestas'
    });

    try {
        const [rows] = await pool.query('DESCRIBE respuestas_encuesta');
        console.table(rows);
    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}
checkTable();
