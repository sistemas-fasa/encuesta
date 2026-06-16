import mysql from 'mysql2/promise';

async function checkDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'encuestas'
    });

    const [rows] = await connection.query('DESCRIBE seccion');
    console.log("Columns in seccion:");
    console.table(rows.map(r => ({Field: r.Field, Type: r.Type})));

    const [secs] = await connection.query('SELECT id, titulo, color, sector_id FROM seccion ORDER BY id DESC LIMIT 5');
    console.log("Recent secciones:");
    console.table(secs);

    await connection.end();
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkDb();
