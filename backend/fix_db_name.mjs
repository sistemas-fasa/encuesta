import mysql from 'mysql2/promise';

async function fixDatabaseName() {
    console.log("Iniciando corrección de base de datos...");
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        multipleStatements: true
    });

    try {
        const [rows] = await conn.query("SHOW DATABASES LIKE 'encuestas'");
        
        if (rows.length === 0) {
            console.log("No se encontró la base de datos 'encuestas'. Quizás ya fue renombrada o tiene otro nombre.");
            // Check if 'encuestas' already exists
            const [rows2] = await conn.query("SHOW DATABASES LIKE 'encuestas'");
            if (rows2.length > 0) {
                console.log("La base de datos 'encuestas' ya existe. Todo debería funcionar.");
            }
            return;
        }

        console.log("Base de datos 'encuestas' detectada. Migrando a 'encuestas'...");

        // 1. Crear la nueva DB
        await conn.query("CREATE DATABASE IF NOT EXISTS encuestas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // 2. Obtener tablas de la vieja
        const [tables] = await conn.query("SHOW TABLES FROM encuestas");
        
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            console.log(`Moviendo tabla: ${tableName}...`);
            await conn.query(`RENAME TABLE encuestas.${tableName} TO encuestas.${tableName}`);
        }

        // 3. Borrar la vieja (opcional, pero recomendado para limpiar)
        await conn.query("DROP DATABASE encuestas");

        console.log("¡Éxito! Tu base de datos local ahora se llama 'encuestas' correctamente.");

    } catch (error) {
        console.error("Error durante la migración:", error.message);
    } finally {
        await conn.end();
    }
}

fixDatabaseName();
