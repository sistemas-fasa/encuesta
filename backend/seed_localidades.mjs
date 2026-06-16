import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const localidades = [
    "25 DE MAYO", "9 DE JULIO", "ALBA POSSE", "ALMAFUERTE", "APOSTOLES", "ARISTOBULO DEL VALLE",
    "ARROYO DEL MEDIO", "AZARA", "BERNARDO DE IRIGOYEN", "BONPLAND", "CAA-YARI", "CAMPO GRANDE",
    "CAMPO RAMON", "CAMPO VIERA", "CANDELARIA", "CAPIOVI", "CARAGUATAY", "CERRO AZUL", "CERRO CORA",
    "COLONIA ALBERDI", "COLONIA ALICIA", "COLONIA AURORA", "COLONIA DELICIA", "COLONIA POLANA",
    "COLONIA VICTORIA", "COLONIA WANDA", "CONCEPCION DE LA SIERRA", "CORPUS", "CTE.A.GUACURARI",
    "DOS ARROYOS", "DOS DE MAYO", "EL ALCAZAR", "EL SOBERBIO", "ELDORADO", "FACHINAL",
    "FLORENTINO AMEGHINO", "GARUHAPE", "GARUPA", "GENERAL ALVEAR", "GENERAL URQUIZA",
    "GOBERNADOR LOPEZ", "GOBERNADOR ROCA", "GUARANI", "HIPOLITO IRIGOYEN", "ITACARUARE",
    "JARDIN AMERICA", "LEANDRO N. ALEM", "LIBERTAD", "LORETO", "LOS HELECHOS", "MARTIRES",
    "MOJON GRANDE", "MONTECARLO", "OBERA", "OLEGARIO VICTOR ANDRADE", "PANAMBI", "PIRAY",
    "POSADAS", "PROFUNDIDAD", "PUERTO ESPERANZA", "PUERTO IGUAZU", "PUERTO LEONI", "PUERTO RICO",
    "RUIZ DE MONTOYA", "SAN ANTONIO", "SAN IGNACIO", "SAN JAVIER", "SAN JOSE", "SAN MARTIN",
    "SAN PEDRO", "SAN VICENTE", "SANTA ANA", "SANTA MARIA", "SANTIAGO DE LINIERS", "SANTO PIPO",
    "TRES CAPONES", "GOBERNADOR VIRASORO"
];

async function run() {
    console.log("Conectando a la base de datos (vía .env)...");
    const pool = mysql.createPool({ 
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'encuestas',
        multipleStatements: true
    });

    try {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE localidad');
        
        console.log("Cargando", localidades.length, "localidades...");
        
        for (const loc of localidades) {
            await pool.query('INSERT IGNORE INTO localidad (nombre) VALUES (?)', [loc.trim()]);
        }
        
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("¡Localidades cargadas con éxito!");
    } catch (e) {
        console.error("Error al cargar:", e.message);
    } finally {
        await pool.end();
    }
}

run();
