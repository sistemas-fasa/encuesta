import mysql from 'mysql2/promise';

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        const [rows] = await pool.query(`SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME = 'envio_encuesta'`);
        console.log("Referencing envio_encuesta:", rows);

        // Also check if any table is named envio_encuesta in case of casing issues
        const [tables] = await pool.query(`SHOW TABLES LIKE '%envio_encuesta%'`);
        console.log("Tables like envio_encuesta:", tables);
        
        // Let's also check if respuesta table has any FK to 'envio_encuesta'
        const [fkRows] = await pool.query(`SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='encuestas'`);
        const invalidFk = fkRows.filter(r => r.REFERENCED_TABLE_NAME === 'envio_encuesta');
        console.log("Invalid FK total scan:", invalidFk);

    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
