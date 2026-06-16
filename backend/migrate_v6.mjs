import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'encuestas'
});

const run = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Iniciando migración v6: Relación Muchos-a-Muchos para Reutilización...\n');

    // 1. Crear tabla intermedia
    console.log('1. Creando tabla encuesta_pregunta...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS encuesta_pregunta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        encuesta_id INT NOT NULL,
        pregunta_id INT NOT NULL,
        seccion_id INT NULL,
        orden INT DEFAULT 0,
        UNIQUE(encuesta_id, pregunta_id),
        FOREIGN KEY (encuesta_id) REFERENCES encuesta(id) ON DELETE CASCADE,
        FOREIGN KEY (pregunta_id) REFERENCES pregunta(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ Tabla creada');

    // 2. Migrar datos existentes (vincular preguntas actuales con sus encuestas)
    console.log('2. Migrando vínculos de preguntas actuales...');
    await conn.query(`
      INSERT IGNORE INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden)
      SELECT encuesta_id, id, seccion_id, orden 
      FROM pregunta 
      WHERE encuesta_id IS NOT NULL
    `);
    console.log('   ✅ Datos migrados');

    console.log('\n🎉 Migración v6 completada exitosamente');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  } finally {
    conn.release();
    pool.end();
  }
};

run();
