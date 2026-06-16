const fs = require('fs');
const content = fs.readFileSync('encuestas_donweb/api/api.php', 'utf8');

content.split('\n').forEach((line, idx) => {
  if (line.toLowerCase().includes('secciones')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
