import ExcelJS from 'exceljs';

interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

export async function createWorkbook(
  sheetName: string,
  columns: ColumnDef[],
  data: Record<string, any>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP Pangan Masa Depan';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  // Set columns
  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 18,
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E7D32' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  // Add data
  data.forEach((row) => {
    sheet.addRow(row);
  });

  // Style data rows
  for (let i = 2; i <= data.length + 1; i++) {
    const row = sheet.getRow(i);
    row.alignment = { vertical: 'middle' };
    if (i % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' },
      };
    }
  }

  // Add borders
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
