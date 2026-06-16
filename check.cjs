const fs = require('fs');
const content = fs.readFileSync('C:/Users/Pc/Documents/Encuestas/dist/api/api.php', 'utf8');
console.log('GET index:', content.indexOf("case 'GET':"));
console.log('SORTEOS index:', content.indexOf('// SORTEOS'));
console.log('404 index:', content.indexOf('404);'));
