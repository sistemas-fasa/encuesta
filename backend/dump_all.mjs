import mysql from 'mysql2/promise';

async function dumpAll() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    try {
        const [tables] = await pool.query('SHOW TABLES');
        const names = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', names);

        for (const name of names) {
            console.log(`\n--- TABLE: ${name} ---`);
            const [cols] = await pool.query(`DESCRIBE ${name}`);
            console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
            
            const [data] = await pool.query(`SELECT * FROM ${name} LIMIT 2`);
            if (data.length > 0) {
                console.log('Sample Data:');
                console.table(data);
            } else {
                console.log('Table is EMPTY');
            }
        }
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        pool.end();
    }
}

dumpAll();
