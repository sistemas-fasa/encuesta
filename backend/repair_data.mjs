import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        console.log('--- REPAIRING SECTOR IDs ---');
        
        // 1. Get sector mapping
        const [sectores] = await pool.query('SELECT id, nombre FROM sector');
        const sectorMap = {};
        sectores.forEach(s => {
            sectorMap[s.nombre] = s.id;
        });
        console.log('Sector Map:', sectorMap);

        // 2. Find all answers to question 16 (Sector Selector)
        const [selectorAns] = await pool.query(`
            SELECT r.fecha_respuesta, r.localidad_id, r.encuesta_periodo_id, o.texto_opcion
            FROM respuesta r
            JOIN opcion o ON r.opcion_id = o.id
            WHERE r.pregunta_id = 16
        `);
        console.log(`Found ${selectorAns.length} sessions with sector info.`);

        let updatedCount = 0;
        for (const session of selectorAns) {
            const sectorId = sectorMap[session.texto_opcion];
            if (sectorId) {
                const [res] = await pool.query(`
                    UPDATE respuesta 
                    SET sector_id = ?
                    WHERE fecha_respuesta = ? 
                      AND localidad_id = ? 
                      AND encuesta_periodo_id = ?
                      AND sector_id IS NULL
                `, [sectorId, session.fecha_respuesta, session.localidad_id, session.encuesta_periodo_id]);
                updatedCount += res.affectedRows;
            }
        }

        console.log(`✅ Success! Updated ${updatedCount} answer rows with their respective sector IDs.`);

        // 3. Optional: Convert question 16 to 'selector_rubro' type for future consistency
        await pool.query('UPDATE pregunta SET tipo = "selector_rubro" WHERE id = 16');
        console.log('✅ Question 16 converted to type "selector_rubro".');

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
