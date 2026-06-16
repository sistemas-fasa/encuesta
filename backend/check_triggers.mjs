import mysql from 'mysql2/promise';

async function run() {
    console.log("Conectando...");
    const pool = mysql.createPool({ 
        host: 'localhost', 
        user: 'root', 
        password: '', 
        database: 'encuestas'
    });

    try {
        const [rows] = await pool.query("SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'encuestas'");
        console.log("Triggers actuales:", rows);
        
        // Also check if there's any view
        const [views] = await pool.query("SELECT TABLE_NAME, VIEW_DEFINITION FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'encuestas'");
        console.log("Vistas:", views);
        
        // Let's also check ROUTINES (Stored Procedures / Functions)
        const [routines] = await pool.query("SELECT ROUTINE_NAME, ROUTINE_DEFINITION FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'encuestas'");
        console.log("Rutinas:", routines);
        
    } catch (e) {
        console.error("Error al revisar:", e.message);
    } finally {
        await pool.end();
    }
}

run();
