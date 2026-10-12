import ExcelJS from 'exceljs';

/** Max rows per export; services apply it via `.take()`. */
export const EXPORT_ROW_LIMIT = 1000;

export const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type ExcelCellValue = string | number | null;

/** Format a date column as `YYYY-MM-DD`; empty when missing. */
export function toExcelDate(
  value: Date | string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function exportFilename(prefix: string, now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `${prefix}-${stamp}.xlsx`;
}

/**
 * Build a single-sheet workbook buffer. Null cells become empty cells
 * so Excel stays sortable. Header row is bold with a frozen top row.
 */
export async function buildExcelBuffer(
  headers: string[],
  rows: ExcelCellValue[][],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row.map((cell) => cell ?? ''));
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  sheet.columns.forEach((column) => {
    let width = 10;
    column.eachCell?.((cell) => {
      const value = cell.value;
      const text =
        typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '';
      if (text.length > width) {
        width = text.length;
      }
    });
    column.width = Math.min(Math.max(width + 2, 10), 50);
  });

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}
