import mysql from 'mysql2/promise';

async function test() {
    try {
        console.log('Connecting to mysql...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'encuestas'
        });
        console.log('Connected! Fetching columns...');
        const [rows] = await connection.query('DESCRIBE seccion');
        console.table(rows);
        await connection.end();
    } catch (error) {
        console.error('FULL ERROR OBJECT:', error);
    }
}

test();
