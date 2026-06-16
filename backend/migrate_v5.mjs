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
    console.log('🚀 Iniciando migración v5: Banco de Preguntas...\n');

    // 1. Hacer encuesta_id nullable en pregunta (para preguntas del banco sin encuesta)
    console.log('1. Haciendo encuesta_id nullable en pregunta...');
    await conn.query(`ALTER TABLE pregunta MODIFY COLUMN encuesta_id INT NULL`);
    console.log('   ✅ pregunta.encuesta_id ahora es nullable');

    // 2. Agregar columna categoria a pregunta (texto simple para organizar)
    const [cols] = await conn.query(`SHOW COLUMNS FROM pregunta LIKE 'categoria'`);
    if (cols.length === 0) {
      console.log('2. Agregando columna categoria a pregunta...');
      await conn.query(`ALTER TABLE pregunta ADD COLUMN categoria VARCHAR(100) NULL DEFAULT NULL`);
      console.log('   ✅ Columna categoria agregada');
    } else {
      console.log('2. ℹ️  Columna categoria ya existe');
    }

    console.log('\n🎉 Migración v5 completada exitosamente');
    console.log('📋 Ahora podés gestionar preguntas desde el tab "Preguntas" en el Panel de Gestión');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  } finally {
    conn.release();
    pool.end();
  }
};

run();
