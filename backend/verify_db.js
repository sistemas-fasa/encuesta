
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkTable() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'encuestas'
        });
        
        const [rows] = await pool.query('DESCRIBE respuestas_encuesta');
        console.log('Structure of respuestas_encuesta:');
        console.table(rows);
        
        await pool.end();
    } catch (err) {
        console.error('Error checking table:', err.message);
    }
}

checkTable();
