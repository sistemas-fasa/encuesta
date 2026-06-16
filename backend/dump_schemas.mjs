import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({ user: 'root', password: '', database: 'encuestas'});
  for (const t of ['empresa', 'respuesta', 'respuesta_opcion', 'respuesta_texto', 'respuesta_cuadricula']) {
    const [res] = await pool.query('SHOW CREATE TABLE ' + t);
    console.log(res[0]['Create Table']);
  }
  pool.end();
}
run();
