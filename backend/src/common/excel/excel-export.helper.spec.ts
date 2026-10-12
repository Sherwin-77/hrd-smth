import ExcelJS from 'exceljs';
import {
  buildExcelBuffer,
  exportFilename,
  toExcelDate,
} from './excel-export.helper.js';

describe('excel-export helper', () => {
  it('formats dates as YYYY-MM-DD and nulls as null', () => {
    expect(toExcelDate(new Date('2026-02-03T10:00:00.000Z'))).toBe(
      '2026-02-03',
    );
    expect(toExcelDate('2026-02-03')).toBe('2026-02-03');
    expect(toExcelDate(null)).toBeNull();
    expect(toExcelDate(undefined)).toBeNull();
  });

  it('builds filenames with a date stamp', () => {
    expect(
      exportFilename('employees', new Date('2026-10-13T00:00:00.000Z')),
    ).toBe('employees-20261013.xlsx');
  });

  it('writes headers plus rows with nulls as empty cells', async () => {
    const buffer = await buildExcelBuffer(
      ['Name', 'Email'],
      [['Jane', null]],
      'Employees',
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Employees');
    expect(sheet?.getRow(1).values).toEqual([undefined, 'Name', 'Email']);
    expect(sheet?.getRow(2).values).toEqual([undefined, 'Jane', '']);
  });
});
