const fs = require('fs');
const sql = fs.readFileSync('db_production.sql', 'utf8');

sql.split('\n').forEach((line, idx) => {
  if (line.includes('opcion') && line.includes(', 2)')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
