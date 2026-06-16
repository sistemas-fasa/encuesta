import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'encuestas_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function run() {
    try {
        const [rows] = await pool.query('SELECT id, encuesta_id, texto_pregunta FROM pregunta WHERE texto_pregunta LIKE "%localidad%"');
        console.log(rows);
    } catch(e) {
        console.log(e);
    }
    process.exit(0);
}
run();
