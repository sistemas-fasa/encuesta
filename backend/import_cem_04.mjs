import xlsx from 'xlsx';
import mysql from 'mysql2/promise';

// Helper for Excel dates
function getExcelDate(excelDate) {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') {
        const d = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
        return d.toISOString().slice(0, 19).replace('T', ' ');
    }
    return null;
}

async function run() {
    const pool = mysql.createPool({ user: 'root', password: '', database: 'encuestas' });
    const filePath = 'C:/Users/Pc/Documents/Encuestas/Archivos/CEM_04.2026.xlsx';
    console.log('Reading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log(`Found ${rows.length} rows to import.`);
    
    const encuesta_periodo_id = 3;
    const encuesta_id = 11;
    
    // Load lookups
    const [localidades] = await pool.query('SELECT id, nombre FROM localidad');
    const [preguntas] = await pool.query('SELECT id, texto_pregunta FROM pregunta WHERE encuesta_id = ?', [encuesta_id]);
    const [opciones] = await pool.query('SELECT id, pregunta_id, texto_opcion FROM opcion');

    // Create missing questions if they don't exist
    const columnQuestions = {};
    const skipCols = ['id_respuesta', 'fecha_respuesta', 'anio', 'mes', 'periodo', 'situacion_iva', 'localidad', 'camara', 'rubro', 'sub_rubro', 'actividad', 'mov_nivel'];
    
    for (const col of headers) {
        if (!col || skipCols.includes(col)) continue;
        
        // Find or create pregunta
        let q = preguntas.find(p => p.texto_pregunta.toLowerCase() === col.toLowerCase());
        if (!q) {
            console.log(`Creating missing question for column: ${col}`);
            const [res] = await pool.query('INSERT INTO pregunta (texto_pregunta, tipo, encuesta_id, seccion_id, orden) VALUES (?, "abierta", ?, 1, 99)', [col, encuesta_id]);
            columnQuestions[col] = res.insertId;
        } else {
            columnQuestions[col] = q.id;
        }
    }

    // Helpers
    function findLocalidad(val) {
        if (!val) return null;
        const match = localidades.find(l => l.nombre.toLowerCase().trim() === String(val).toLowerCase().trim());
        return match ? match.id : null;
    }
    
    function findOpcion(preguntaId, val) {
        if (!val) return null;
        const strVal = String(val).toLowerCase().trim();
        const match = opciones.find(o => o.pregunta_id === preguntaId && o.texto_opcion.toLowerCase().trim().includes(strVal));
        return match ? match.id : null;
    }

    let imported = 0;
    
    // Insert rows
    for (const row of rows) {
        if (row.length === 0) continue;
        
        // Map row to headers
        const rowData = {};
        headers.forEach((h, i) => { rowData[h] = row[i]; });
        
        const loc_id = findLocalidad(rowData.localidad);
        const fecha = getExcelDate(rowData.fecha_respuesta) || new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Start transaction or insert directly
        try {
            // Situacion IVA (pregunta 11)
            if (rowData.situacion_iva) {
                const op = findOpcion(11, rowData.situacion_iva);
                if (op) await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id) VALUES (?, ?, ?, ?, ?)', [encuesta_periodo_id, 11, op, fecha, loc_id]);
            }
            
            // Camara (pregunta 13)
            if (rowData.camara) {
                const op = findOpcion(13, rowData.camara.split('-')[1] || rowData.camara);
                if (op) await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id) VALUES (?, ?, ?, ?, ?)', [encuesta_periodo_id, 13, op, fecha, loc_id]);
            }
            
            // Rubro (pregunta 16) - text or option?
            let sector_id = null;
            if (rowData.rubro) {
                const op = findOpcion(16, rowData.rubro);
                if (op) {
                    await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, fecha_respuesta, localidad_id, valor_texto) VALUES (?, ?, ?, ?, ?, ?)', [encuesta_periodo_id, 16, op, fecha, loc_id, rowData.rubro]);
                    // find sector_id based on rubro text
                    if (rowData.rubro.toLowerCase() === 'comercio') sector_id = 1;
                    if (rowData.rubro.toLowerCase() === 'servicios') sector_id = 5;
                    if (rowData.rubro.toLowerCase() === 'industria') sector_id = 3;
                    if (rowData.rubro.toLowerCase() === 'turismo') sector_id = 4;
                }
            }
            
            // Mov Nivel (cuadricula) - depends on sector
            if (rowData.mov_nivel && rowData.sub_rubro) {
                let pId = null;
                if (sector_id === 1) pId = 20;
                else if (sector_id === 5) pId = 21;
                else if (sector_id === 3) pId = 22;
                else if (sector_id === 4) pId = 23;
                
                if (pId) {
                    const op = findOpcion(pId, rowData.mov_nivel); // The rating (MUY MALO, etc)
                    if (op) {
                        await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, opcion_id, valor_texto, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [encuesta_periodo_id, pId, op, rowData.sub_rubro, fecha, loc_id, sector_id]);
                    }
                }
            }
            
            // Unmapped / other columns
            for (const col of headers) {
                if (skipCols.includes(col) || !rowData[col]) continue;
                const pId = columnQuestions[col];
                if (pId) {
                    await pool.query('INSERT INTO respuesta (encuesta_periodo_id, pregunta_id, valor_texto, fecha_respuesta, localidad_id, sector_id) VALUES (?, ?, ?, ?, ?, ?)', [encuesta_periodo_id, pId, String(rowData[col]), fecha, loc_id, sector_id]);
                }
            }
            
            imported++;
        } catch (e) {
            console.error('Error importing row:', e);
        }
    }
    
    console.log(`✅ Successfully imported ${imported} rows.`);
    await pool.end();
}

run();
