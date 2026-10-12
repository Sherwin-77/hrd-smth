import ExcelJS from 'exceljs';
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasher } from '@nestjs/authentication';
import { vi } from 'vitest';
import {
  EmployeesService,
  EMPLOYEE_EXPORT_HEADERS,
} from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { Employee, EmployeeSex } from './entities/employee.entity.js';
import { EXPORT_ROW_LIMIT } from '#common/excel/excel-export.helper.js';

describe('EmployeesService exportToExcel', () => {
  it('exports filtered rows capped at the row limit', async () => {
    const employee = {
      id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '08123456789',
      address: 'Jakarta',
      sex: EmployeeSex.FEMALE,
      birthDate: new Date('1990-01-01'),
      joinAt: new Date('2024-01-15'),
      leaveAt: null,
    } as Employee;

    const qb = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([employee]),
    };
    const repository = { createQueryBuilder: vi.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repository },
        { provide: PasswordHasher, useValue: { hash: vi.fn() } },
      ],
    }).compile();

    const service = module.get<EmployeesService>(EmployeesService);
    const buffer = await service.exportToExcel({ search: 'jane' });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('employee');
    expect(qb.take).toHaveBeenCalledWith(EXPORT_ROW_LIMIT);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Employees');
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      ...EMPLOYEE_EXPORT_HEADERS,
    ]);
    expect(sheet?.getRow(2).values).toEqual([
      undefined,
      'Jane Doe',
      'jane@example.com',
      '08123456789',
      '2024-01-15',
    ]);
  });
});
