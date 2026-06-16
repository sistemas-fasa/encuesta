import xlsx from 'xlsx';

const filePath = 'C:/Users/Pc/Documents/Encuestas/Archivos/CEM_04.2026.xlsx';

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Read top 5 rows to see what it looks like
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log('--- HEADERS (ROW 0) ---');
  console.log(data[0]);
  console.log('\n--- FIRST DATA ROW (ROW 1) ---');
  console.log(data[1]);
  console.log('\nTotal rows:', data.length);
} catch (e) {
  console.error(e);
}
