import * as XLSX from 'xlsx';

export function parseExcelToRows(buffer: Buffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
  return rows.map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell).trim())));
}

export function isExcelFile(filename: string): boolean {
  return /\.(xlsx|xls)$/i.test(filename);
}
