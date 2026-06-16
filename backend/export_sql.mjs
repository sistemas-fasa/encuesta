import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'encuestas'
    });

    let sql = '-- Survey System Production Dump\n';
    sql += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

    try {
        const [tables] = await pool.query('SHOW TABLES');
        const names = tables.map(t => Object.values(t)[0]);

        for (const name of names) {
            // Structure
            const [create] = await pool.query('SHOW CREATE TABLE ' + name);
            sql += '-- Structure for ' + name + '\n';
            sql += 'DROP TABLE IF EXISTS `' + name + '`;\n';
            sql += create[0]['Create Table'] + ';\n\n';

            // Data
            const [data] = await pool.query('SELECT * FROM ' + name);
            if (data.length > 0) {
                sql += '-- Data for ' + name + '\n';
                for (const row of data) {
                    const keys = Object.keys(row).map(k => '`' + k + '`').join(', ');
                    const vals = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (v instanceof Date) {
                            return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
                        }
                        if (typeof v === 'string') {
                            return "'" + v.replace(/'/g, "''") + "'";
                        }
                        return v;
                    }).join(', ');
                    sql += 'INSERT INTO `' + name + '` (' + keys + ') VALUES (' + vals + ');\n';
                }
                sql += '\n';
            }
        }

        sql += 'SET FOREIGN_KEY_CHECKS = 1;';
        
        const outputPath = path.join(process.cwd(), '..', 'db_production.sql');
        fs.writeFileSync(outputPath, sql);
        console.log('✅ SQL dump created successfully at: ' + outputPath);

    } catch (error) {
        console.error('❌ Error generating dump:', error.message);
    } finally {
        await pool.end();
    }
}

run();
