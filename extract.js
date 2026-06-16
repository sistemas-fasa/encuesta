const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Pc/Documents/Encuestas/backend/server.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("app.get('/api/usuarios'"));
const end = lines.findIndex((l, i) => i > start && l.includes("app.get('/api/camaras'"));
console.log(lines.slice(start, end).join('\n'));
