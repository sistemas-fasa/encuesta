import mysql from 'mysql2/promise';

async function inspectSchema() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    try {
        console.log('--- OPCION Table ---');
        const [oCols] = await pool.query("SHOW COLUMNS FROM opcion");
        console.table(oCols);

        console.log('--- PREGUNTA Table ---');
        const [pCols] = await pool.query("SHOW COLUMNS FROM pregunta");
        console.table(pCols);

        console.log('--- RESPUESTA Table (or results) ---');
        const [tables] = await pool.query("SHOW TABLES");
        console.log('Available tables:', tables.map(t => Object.values(t)[0]));

        // Check for respuesta or similar
        const resTable = tables.find(t => Object.values(t)[0].includes('respuest') || Object.values(t)[0].includes('result'));
        if (resTable) {
            const tableName = Object.values(resTable)[0];
            const [rCols] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
            console.log(`--- ${tableName} Table ---`);
            console.table(rCols);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

inspectSchema();
