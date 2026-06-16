import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        const [qs] = await pool.query('SELECT id, texto_pregunta FROM pregunta WHERE tipo = "selector_rubro"');
        console.log('Selector Rubro Questions:', qs);
        
        if (qs.length > 0) {
            const [ans] = await pool.query('SELECT * FROM respuesta WHERE pregunta_id = ? LIMIT 5', [qs[0].id]);
            console.log('Sample answers for selector_rubro:', ans);
        }
    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
