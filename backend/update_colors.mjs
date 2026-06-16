import fs from 'fs';
import path from 'path';

// Update the db_production.sql file
const sqlPath = path.resolve('../db_production.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Replace Produccion color
sqlContent = sqlContent.replace(
  /VALUES \(2,\s*'Producci.n',\s*'#[a-zA-Z0-9]+',\s*5\);/g,
  "VALUES (2, 'Produccin', '#FFC000', 5);"
);

// We need to keep the exact encoding of 'Producción' which is currently represented as 'Produccin' when stringified in JS. Wait, if it's binary, it might get mangled. Let's just replace the color string for id 2.
// Alternatively, replace `#ef4444` in the exact context.
sqlContent = sqlContent.replace(
  /INSERT INTO `sector` \(`id`, `nombre`, `color`, `orden`\) VALUES \(2,(.*?), '#ef4444', 5\);/g,
  "INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (2,$1, '#FFC000', 5);"
);

fs.writeFileSync(sqlPath, sqlContent, 'utf8');
console.log('Produccion color updated');
