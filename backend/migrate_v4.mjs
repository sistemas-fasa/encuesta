import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'encuestas',
  waitForConnections: true, connectionLimit: 10
});

const run = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Iniciando migración v4: Sectores...');

    // 1. Crear tabla sector
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sector (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#0ea5e9',
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla sector creada');

    // 2. Agregar sector_id a seccion (si no existe)
    const [secCols] = await conn.query(`SHOW COLUMNS FROM seccion LIKE 'sector_id'`);
    if (secCols.length === 0) {
      await conn.query(`ALTER TABLE seccion ADD COLUMN sector_id INT NULL`);
      console.log('✅ Columna sector_id agregada a seccion');
    } else {
      console.log('ℹ️  sector_id ya existe en seccion');
    }

    // 3. Agregar sector_id a respuesta (si no existe)
    const [respCols] = await conn.query(`SHOW COLUMNS FROM respuesta LIKE 'sector_id'`);
    if (respCols.length === 0) {
      await conn.query(`ALTER TABLE respuesta ADD COLUMN sector_id INT NULL`);
      console.log('✅ Columna sector_id agregada a respuesta');
    } else {
      console.log('ℹ️  sector_id ya existe en respuesta');
    }

    // 4. Insertar sectores por defecto si la tabla está vacía
    const [existing] = await conn.query('SELECT COUNT(*) as c FROM sector');
    if (existing[0].c === 0) {
      await conn.query(`
        INSERT INTO sector (nombre, color, orden) VALUES
        ('Comercio',   '#0ea5e9', 1),
        ('Servicios',  '#10b981', 2),
        ('Industria',  '#f59e0b', 3),
        ('Turismo',    '#8b5cf6', 4),
        ('Producción', '#ef4444', 5)
      `);
      console.log('✅ Sectores por defecto insertados');
    } else {
      console.log('ℹ️  Sectores ya existen, no se insertaron');
    }

    console.log('\n🎉 Migración v4 completada exitosamente');
    console.log('📋 Próximos pasos en el Admin:');
    console.log('   1. Ir a tab "Sectores" y vincular cada sector a su sección');
    console.log('   2. Crear una pregunta tipo "Selector de Rubro (Automático)"');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  } finally {
    conn.release();
    pool.end();
  }
};

run();
