import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'encuestas',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log("Iniciando migración para Sorteos...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sorteos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                periodo VARCHAR(255) NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                activo TINYINT(1) DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Tabla 'sorteos' creada o ya existe.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sorteos_camaras (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_sorteo INT NOT NULL,
                id_camara INT NOT NULL,
                FOREIGN KEY (id_sorteo) REFERENCES sorteos(id) ON DELETE CASCADE,
                FOREIGN KEY (id_camara) REFERENCES camara(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Tabla 'sorteos_camaras' creada o ya existe.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sorteo (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_sorteo INT NOT NULL,
                id_camara INT NOT NULL,
                apellido VARCHAR(255) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                domicilio VARCHAR(255) NOT NULL,
                telefono VARCHAR(255) NOT NULL,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_sorteo) REFERENCES sorteos(id) ON DELETE CASCADE,
                FOREIGN KEY (id_camara) REFERENCES camara(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Tabla 'sorteo' creada o ya existe.");

        console.log("Migración completada exitosamente.");
    } catch (error) {
        console.error("Error en la migración:", error);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
