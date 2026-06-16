import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        const encuesta_id = 1; 
        const pregunta_id = 16; // Selector Rubro
        
        console.log(`Testing historical stats for encuesta ${encuesta_id}, pregunta ${pregunta_id}`);
        
        const [rows] = await pool.query(`
            SELECT ep.id as periodo_id, ep.mes, ep.anio,
                   o.texto_opcion, r.valor_texto, COUNT(r.id) as count
            FROM encuesta_periodo ep
            JOIN respuesta r ON r.encuesta_periodo_id = ep.id
            LEFT JOIN opcion o ON r.opcion_id = o.id
            WHERE ep.encuesta_id = ? AND r.pregunta_id = ?
            GROUP BY ep.id, o.id, r.valor_texto 
            ORDER BY ep.anio ASC, ep.mes ASC
        `, [encuesta_id, pregunta_id]);
        
        console.log('Results:', rows);

        if (rows.length === 0) {
            console.log('Check if survey has periods:');
            const [periods] = await pool.query('SELECT * FROM encuesta_periodo WHERE encuesta_id = ?', [encuesta_id]);
            console.log('Periods:', periods);
            
            console.log('Check if answers exist for this question:');
            const [ansCount] = await pool.query('SELECT COUNT(*) as count FROM respuesta WHERE pregunta_id = ?', [pregunta_id]);
            console.log('Answers for q:', ansCount[0].count);
        }

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
