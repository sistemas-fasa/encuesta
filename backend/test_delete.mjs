import mysql from 'mysql2/promise';

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        const [encuestas] = await pool.query(`SELECT id FROM encuesta LIMIT 1`);
        if (encuestas.length === 0) {
            console.log("No encuestas to delete.");
            process.exit(0);
        }
        const id = encuestas[0].id;
        console.log("Trying to delete id", id);
        
        try {
            await pool.query('DELETE FROM respuesta WHERE encuesta_periodo_id IN (SELECT id FROM encuesta_periodo WHERE encuesta_id = ?)', [id]);
            console.log("Deleted resp");
        } catch(e) { console.log("error deleting resp:", e.message); }
        
        try {
            await pool.query('DELETE FROM encuesta_periodo WHERE encuesta_id = ?', [id]);
            console.log("Deleted periods");
        } catch(e) { console.log("error deleting periods:", e.message); }

        try {
            await pool.query('DELETE FROM opcion WHERE pregunta_id IN (SELECT id FROM pregunta WHERE encuesta_id = ?)', [id]);
            console.log("Deleted options");
        } catch(e) { console.log("error deleting options:", e.message); }

         try {
            await pool.query('DELETE FROM pregunta WHERE encuesta_id = ?', [id]);
            console.log("Deleted preg");
        } catch(e) { console.log("error deleting preg:", e.message); }

         try {
            await pool.query('DELETE FROM encuesta WHERE id = ?', [id]);
            console.log("Deleted enc");
        } catch(e) { console.log("error deleting enc:", e.message); }

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
