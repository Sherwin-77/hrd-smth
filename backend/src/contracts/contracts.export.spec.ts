import ExcelJS from 'exceljs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import {
  ContractsService,
  CONTRACT_EXPORT_HEADERS,
} from './contracts.service.js';
import {
  Contract,
  ContractStatus,
  ContractType,
} from './entities/contract.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';
import { EXPORT_ROW_LIMIT } from '#common/excel/excel-export.helper.js';

describe('ContractsService exportToExcel', () => {
  it('splits the employee into name and email columns', async () => {
    const contract = {
      id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
      employeeId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
      type: ContractType.FIXED_TIME,
      title: 'Software Engineer',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      signedDate: null,
      status: ContractStatus.PENDING,
      employee: {
        id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    } as unknown as Contract;

    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([contract]),
    };
    const contracts = { createQueryBuilder: vi.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: getRepositoryToken(Contract), useValue: contracts },
        { provide: getRepositoryToken(Employee), useValue: {} },
      ],
    }).compile();

    const service = module.get<ContractsService>(ContractsService);
    const buffer = await service.exportToExcel({});

    expect(qb.take).toHaveBeenCalledWith(EXPORT_ROW_LIMIT);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Contracts');
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      ...CONTRACT_EXPORT_HEADERS,
    ]);
    expect(sheet?.getRow(2).values).toEqual([
      undefined,
      'Jane Doe',
      'jane@example.com',
      'Software Engineer',
      ContractType.FIXED_TIME,
      '2026-01-01',
      '2026-12-31',
      '',
      ContractStatus.PENDING,
    ]);
  });
});
