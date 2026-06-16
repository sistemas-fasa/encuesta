import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'encuestas'
});

const run = async () => {
  const conn = await pool.getConnection();
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM sector LIKE 'color'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE sector ADD COLUMN color VARCHAR(20) DEFAULT '#0ea5e9'");
      console.log('✅ Columna color agregada');
    } else {
      console.log('ℹ️  color ya existe');
    }

    const [cols2] = await conn.query("SHOW COLUMNS FROM sector LIKE 'orden'");
    if (cols2.length === 0) {
      await conn.query("ALTER TABLE sector ADD COLUMN orden INT DEFAULT 0");
      console.log('✅ Columna orden agregada');
    } else {
      console.log('ℹ️  orden ya existe');
    }

    // Official Brand Colors from Dashboard
    await conn.query("UPDATE sector SET color='#ed7d31', orden=1 WHERE nombre='Comercio'");
    await conn.query("UPDATE sector SET color='#70ad47', orden=2 WHERE nombre='Servicios'");
    await conn.query("UPDATE sector SET color='#7030a0', orden=3 WHERE nombre='Industria'");
    await conn.query("UPDATE sector SET color='#4472c4', orden=4 WHERE nombre='Turismo'");
    await conn.query("UPDATE sector SET color='#ffc000', orden=5 WHERE nombre LIKE 'Producci%'");

    const [rows] = await conn.query('SELECT * FROM sector ORDER BY orden');
    console.log('Sectores:', JSON.stringify(rows, null, 2));
    console.log('✅ Listo');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    conn.release();
    pool.end();
  }
};

run();
