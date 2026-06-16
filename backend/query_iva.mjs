import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function queryIva() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'encuestas'
    });

    try {
        console.log('Querying Database with DB_NAME:', process.env.DB_NAME);
        const [periods] = await pool.query('SELECT * FROM encuesta_periodo');
        console.log('Periods found:', periods.length, periods.map(p => ({ id: p.id, mes: p.mes, anio: p.anio })));

        const [ivas] = await pool.query('SELECT * FROM situacion_iva');
        console.log('Situacion IVA list:', ivas);

        const [sectors] = await pool.query('SELECT * FROM sector');
        console.log('Sectors:', sectors);

        const [answers] = await pool.query('SELECT DISTINCT pregunta_id, valor_texto, COUNT(*) as c FROM respuesta WHERE pregunta_id = 11 GROUP BY pregunta_id, valor_texto');
        console.log('Answers for Q11 (IVA):', answers);

        const [sectorsRes] = await pool.query('SELECT DISTINCT sector_id, COUNT(*) as c FROM respuesta GROUP BY sector_id');
        console.log('Sectors in responses:', sectorsRes);

        // Find how many responses have both a participant (fecha_respuesta, localidad_id, encuesta_periodo_id) and check the cross tab
        const [cross] = await pool.query(`
            SELECT 
                iva_resp.valor_texto AS iva_status,
                r.sector_id,
                sec.nombre AS sector_nombre,
                COUNT(DISTINCT r.fecha_respuesta, r.localidad_id) AS participant_count
            FROM respuesta r
            JOIN respuesta iva_resp ON r.encuesta_periodo_id = iva_resp.encuesta_periodo_id 
                                   AND r.localidad_id = iva_resp.localidad_id 
                                   AND r.fecha_respuesta = iva_resp.fecha_respuesta
            JOIN pregunta iva_preg ON iva_resp.pregunta_id = iva_preg.id
            JOIN sector sec ON r.sector_id = sec.id
            WHERE (iva_preg.texto_pregunta LIKE '%iva%' OR iva_preg.texto_pregunta LIKE '%IVA%')
            GROUP BY iva_status, r.sector_id, sector_nombre
        `);
        console.log('Cross tab data:', cross);

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await pool.end();
    }
}
queryIva();
