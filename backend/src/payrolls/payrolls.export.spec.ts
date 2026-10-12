import ExcelJS from 'exceljs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { PayrollsService, PAYROLL_EXPORT_HEADERS } from './payrolls.service.js';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';
import { EXPORT_ROW_LIMIT } from '#common/excel/excel-export.helper.js';

describe('PayrollsService exportToExcel', () => {
  it('exports the tax percentage as a percentage number', async () => {
    const payroll = {
      id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
      employeeId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
      accountNumber: '1234567890',
      accountName: 'Jane Doe',
      taxPercentage: 0.05,
      status: PayrollStatus.ACTIVE,
      employee: {
        id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    } as unknown as Payroll;

    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([payroll]),
    };
    const payrolls = { createQueryBuilder: vi.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollsService,
        { provide: getRepositoryToken(Payroll), useValue: payrolls },
        { provide: getRepositoryToken(Employee), useValue: {} },
      ],
    }).compile();

    const service = module.get<PayrollsService>(PayrollsService);
    const buffer = await service.exportToExcel({});

    expect(qb.take).toHaveBeenCalledWith(EXPORT_ROW_LIMIT);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Payrolls');
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      ...PAYROLL_EXPORT_HEADERS,
    ]);
    expect(sheet?.getRow(2).values).toEqual([
      undefined,
      'Jane Doe',
      'jane@example.com',
      'Jane Doe',
      '1234567890',
      5,
      PayrollStatus.ACTIVE,
    ]);
  });
});
