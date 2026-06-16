import mysql from 'mysql2/promise';

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'encuestas' });
    try {
        const [tables] = await pool.query('SHOW TABLES'); 
        for(let t of tables) { 
            let tname = Object.values(t)[0]; 
            const [rows] = await pool.query(`SHOW CREATE TABLE \`${tname}\``); 
            const createSQL = rows[0]['Create Table'] || rows[0]['Create View']; 
            if (createSQL && createSQL.includes('envio_encuesta')) { 
                console.log('FOUND IN:', tname); 
                console.log(createSQL);
            } 
        } 
    } catch (e) {
        console.log(e);
    }
    process.exit(0);
}
run();
