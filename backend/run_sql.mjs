import fs from 'fs';
import mysql from 'mysql2/promise';

async function run() {
    const pool = mysql.createPool({ user: 'root', password: '', database: 'encuestas', multipleStatements: true });
    const sql = fs.readFileSync('backend/create_import_tables.sql', 'utf8');
    await pool.query(sql);
    console.log('Tables created successfully.');
    await pool.end();
}
run();
