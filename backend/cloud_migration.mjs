import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// DATOS DE ORIGEN (Tu base local en la PC)
const localConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'encuestas'
};

// DATOS DE DESTINO (Clever Cloud - SE REEMPLAZARÁN CON LOS TUS DATOS)
const cloudConfig = {
    host: 'REEMPLAZAR_HOST',
    user: 'REEMPLAZAR_USER',
    password: 'REEMPLAZAR_PASSWORD',
    database: 'REEMPLAZAR_DB_NAME',
    ssl: { rejectUnauthorized: false }
};

const migrate = async () => {
    let localConn, cloudConn;
    try {
        console.log('🔗 Conectando a base de datos LOCAL...');
        localConn = await mysql.createConnection(localConfig);
        
        console.log('🔗 Conectando a base de datos CLOUD (Clever Cloud)...');
        cloudConn = await mysql.createConnection(cloudConfig);

        const tables = [
            'usuarios', 'sector', 'encuesta', 'seccion', 
            'pregunta', 'opcion', 'encuesta_periodo', 
            'localidad', 'camara', 'situacion_iva', 'rubro', 'respuesta'
        ];

        for (const table of tables) {
            console.log(`📦 Migrando tabla: ${table}...`);
            
            // 1. Obtener estructura (Create Table)
            const [showCreate] = await localConn.query(`SHOW CREATE TABLE ${table}`);
            const createSql = showCreate[0]['Create Table'];
            
            // 2. Crear tabla en destino (si no existe)
            await cloudConn.query(`DROP TABLE IF EXISTS ${table}`);
            await cloudConn.query(createSql);
            
            // 3. Obtener datos
            const [rows] = await localConn.query(`SELECT * FROM ${table}`);
            if (rows.length > 0) {
                const keys = Object.keys(rows[0]);
                const values = rows.map(r => keys.map(k => r[k]));
                const placeholders = keys.map(() => '?').join(',');
                
                await cloudConn.query(
                    `INSERT INTO ${table} (${keys.join(',')}) VALUES ?`,
                    [values]
                );
                console.log(`✅ ${rows.length} registros migrados.`);
            } else {
                console.log(`ℹ️ Tabla vacía.`);
            }
        }

        console.log('\n🌟 ¡MIGRACIÓN COMPLETADA CON ÉXITO! 🌟');
        console.log('Ahora Render podrá conectarse a esta nueva base de datos.');

    } catch (error) {
        console.error('❌ ERROR DURANTE LA MIGRACIÓN:', error.message);
    } finally {
        if (localConn) await localConn.end();
        if (cloudConn) await cloudConn.end();
    }
};

migrate();
