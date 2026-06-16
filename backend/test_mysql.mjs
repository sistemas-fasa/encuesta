import mysql from 'mysql2/promise';

async function test() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    try {
        console.log('Testing connection...');
        const [cols] = await pool.query('DESCRIBE empresa');
        console.log('Table: empresa');
        console.table(cols);

        console.log('\nTesting query: SELECT id, razon_social as nombre, camara_id FROM empresa ORDER BY razon_social');
        const [rows] = await pool.query('SELECT id, razon_social as nombre, camara_id FROM empresa ORDER BY razon_social');
        console.log('Success! Rows found:', rows.length);
        if (rows.length > 0) console.log('First row:', rows[0]);
    } catch (error) {
        console.error('FAILED:', error.message);
    } finally {
        pool.end();
    }
}

test();
