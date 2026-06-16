const fs = require('fs');
const path = 'C:\\Users\\Pc\\Documents\\Encuestas\\src\\pages\\Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Constructor Dinámico de Gráficos Cruzados (Pivot Charts) */}'));
if (startIdx === -1) { console.error('Pivot Charts start not found'); process.exit(1); }

let endIdx = -1;
for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('          {loading ? (')) {
        endIdx = i - 2; 
        break;
    }
}
if (endIdx === -1) { console.error('Pivot Charts end not found'); process.exit(1); }

const pivotLines = lines.slice(startIdx, endIdx + 1);
lines.splice(startIdx, endIdx - startIdx + 1);

const insertTarget = "<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>";
const insertIdx = lines.findIndex(l => l.includes(insertTarget)) + 1;

if (insertIdx === 0) { console.error('Insert pos not found'); process.exit(1); }

lines.splice(insertIdx, 0, ...pivotLines, '');

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Moved successfully!');
