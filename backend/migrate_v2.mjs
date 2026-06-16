import mysql from 'mysql2/promise';

async function runMigrations() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    try {
        console.log('Starting migrations...');

        // 1. Create survey table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS encuesta (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                descripcion TEXT,
                estado TINYINT(1) DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Add columns to pregunta
        const [pCols] = await pool.query("SHOW COLUMNS FROM pregunta");
        if (!pCols.some(c => c.Field === 'encuesta_id')) {
            console.log('Adding encuesta_id and orden to pregunta...');
            await pool.query("ALTER TABLE pregunta ADD COLUMN encuesta_id INT NULL");
            await pool.query("ALTER TABLE pregunta ADD COLUMN orden INT DEFAULT 0");
            await pool.query("ALTER TABLE pregunta ADD CONSTRAINT fk_pregunta_encuesta FOREIGN KEY (encuesta_id) REFERENCES encuesta(id)");
        }

        // 3. Add column to opcion (Conditional Logic)
        const [oCols] = await pool.query("SHOW COLUMNS FROM opcion");
        if (!oCols.some(c => c.Field === 'siguiente_pregunta_id')) {
            console.log('Adding siguiente_pregunta_id to opcion...');
            await pool.query("ALTER TABLE opcion ADD COLUMN siguiente_pregunta_id INT NULL");
            await pool.query("ALTER TABLE opcion ADD CONSTRAINT fk_opcion_siguiente FOREIGN KEY (siguiente_pregunta_id) REFERENCES pregunta(id)");
        }

        // 4. Update encuesta_periodo
        const [epCols] = await pool.query("SHOW COLUMNS FROM encuesta_periodo");
        if (!epCols.some(c => c.Field === 'encuesta_id')) {
            console.log('Adding encuesta_id to encuesta_periodo...');
            await pool.query("ALTER TABLE encuesta_periodo ADD COLUMN encuesta_id INT NULL");
            await pool.query("ALTER TABLE encuesta_periodo ADD CONSTRAINT fk_periodo_encuesta FOREIGN KEY (encuesta_id) REFERENCES encuesta(id)");
        }

        // 5. Add valor to opcion (for Matrix questions)
        const [oColsAgain] = await pool.query("SHOW COLUMNS FROM opcion");
        if (!oColsAgain.some(c => c.Field === 'valor')) {
            console.log('Adding valor column to opcion table...');
            await pool.query("ALTER TABLE opcion ADD COLUMN valor INT NULL");
        }

        // 6. Create envio_encuesta (Restriction: one response per period)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS envio_encuesta (
                id INT AUTO_INCREMENT PRIMARY KEY,
                empresa_id INT NOT NULL,
                encuesta_periodo_id INT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_envio (empresa_id, encuesta_periodo_id)
            )
        `);

        // 6. Seed initial survey if empty
        const [counts] = await pool.query("SELECT COUNT(*) as count FROM encuesta");
        if (counts[0].count === 0) {
            console.log('Seeding initial survey...');
            const [result] = await pool.query("INSERT INTO encuesta (titulo, descripcion) VALUES (?, ?)", 
                ['Encuesta de Relevamiento Industrial', 'Encuesta mensual para el relevamiento de la actividad industrial en la provincia.']);
            const encuestaId = result.insertId;
            
            // Assign existing questions to this survey
            await pool.query("UPDATE pregunta SET encuesta_id = ?", [encuestaId]);
            await pool.query("UPDATE encuesta_periodo SET encuesta_id = ?", [encuestaId]);
        }

        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigrations();
