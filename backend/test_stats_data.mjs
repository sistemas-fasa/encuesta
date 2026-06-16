import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function testStats() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'encuestas'
    });

    try {
        // Find a period with data
        const [periods] = await pool.query('SELECT id FROM encuesta_periodo LIMIT 1');
        if (periods.length === 0) {
            console.log('No periods found');
            return;
        }
        const periodoId = periods[0].id;

        // Mock the logic from server.js getStats
        console.log('Testing stats for period:', periodoId);
        
        const [answers] = await pool.query(`
            SELECT 
                r.*, 
                p.texto_pregunta, p.tipo,
                o.texto_opcion, o.valor as opcion_valor,
                s.nombre as sector_nombre, s.color as sector_color
            FROM respuesta r
            JOIN pregunta p ON r.pregunta_id = p.id
            LEFT JOIN opcion o ON r.opcion_id = o.id
            LEFT JOIN sector s ON r.sector_id = s.id
            WHERE r.encuesta_periodo_id = ?
        `, [periodoId]);

        console.log('Answers count:', answers.length);
        if (answers.length > 0) {
            console.log('Sample answer:', JSON.stringify(answers[0], null, 2));
        }

        const [distribution] = await pool.query(`
            SELECT s.id as sector_id, s.nombre, s.color, COUNT(DISTINCT r.id) as count
            FROM sector s
            LEFT JOIN respuesta r ON s.id = r.sector_id AND r.encuesta_periodo_id = ?
            GROUP BY s.id, s.nombre, s.color
        `, [periodoId]);
        
        console.log('Distribution:', JSON.stringify(distribution, null, 2));

    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}
testStats();
