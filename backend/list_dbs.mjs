import mysql from 'mysql2/promise';

async function listDbs() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    try {
        const [dbs] = await pool.query('SHOW DATABASES');
        console.table(dbs);
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        pool.end();
    }
}

listDbs();
