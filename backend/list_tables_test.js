
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function listTables() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'encuestas'
        });
        
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tables in database:', process.env.DB_NAME);
        console.table(rows);
        
        await pool.end();
    } catch (err) {
        console.error('Error listing tables:', err.message);
    }
}

listTables();
