import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'encuestas'
});

const [tables] = await pool.query('SHOW TABLES');
console.log('TABLES:', tables.map(t => Object.values(t)[0]));

for (const t of tables) {
  const name = Object.values(t)[0];
  const [cols] = await pool.query(`SHOW COLUMNS FROM \`${name}\``);
  console.log(`\n--- ${name} ---`);
  cols.forEach(c => console.log(`  ${c.Field} | ${c.Type} | ${c.Null} | Key:${c.Key} | Default:${c.Default || 'NULL'}`));
}

// Show some sample data
const [preguntas] = await pool.query('SELECT id, texto_pregunta, tipo, encuesta_id, seccion_id FROM pregunta LIMIT 10');
console.log('\n--- Sample preguntas ---');
console.table(preguntas);

const [secciones] = await pool.query('SELECT * FROM seccion LIMIT 10');
console.log('\n--- Sample secciones ---');
console.table(secciones);

const [encuestas] = await pool.query('SELECT * FROM encuesta LIMIT 10');
console.log('\n--- Sample encuestas ---');
console.table(encuestas);

await pool.end();
