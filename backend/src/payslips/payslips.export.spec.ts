import ExcelJS from 'exceljs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { PayslipsService, PAYSLIP_EXPORT_HEADERS } from './payslips.service.js';
import { Payslip, PayslipStatus } from './entities/payslip.entity.js';
import { Payroll } from '#payrolls/entities/payroll.entity.js';
import { EXPORT_ROW_LIMIT } from '#common/excel/excel-export.helper.js';

describe('PayslipsService exportToExcel', () => {
  it('exports amounts with the employee split into two columns', async () => {
    const payslip = {
      id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
      employeeId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
      payrollId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9b',
      basicSalary: 1000,
      overtime: 100,
      bonus: 50,
      tax: 20,
      deduction: 30,
      total: 1100,
      date: new Date('2026-03-01'),
      status: PayslipStatus.PENDING,
      employee: {
        id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    } as unknown as Payslip;

    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([payslip]),
    };
    const payslips = { createQueryBuilder: vi.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipsService,
        { provide: getRepositoryToken(Payslip), useValue: payslips },
        { provide: getRepositoryToken(Payroll), useValue: {} },
      ],
    }).compile();

    const service = module.get<PayslipsService>(PayslipsService);
    const buffer = await service.exportToExcel({});

    expect(qb.take).toHaveBeenCalledWith(EXPORT_ROW_LIMIT);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Payslips');
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      ...PAYSLIP_EXPORT_HEADERS,
    ]);
    expect(sheet?.getRow(2).values).toEqual([
      undefined,
      'Jane Doe',
      'jane@example.com',
      '2026-03-01',
      1000,
      100,
      50,
      20,
      30,
      1100,
      PayslipStatus.PENDING,
    ]);
  });
});
