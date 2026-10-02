import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { Employee, EmployeeSex } from './entities/employee.entity.js';
import {
  Payroll,
  PayrollStatus,
} from '#payrolls/entities/payroll.entity.js';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    findOneWithActivePayroll: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const employee = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '08123456789',
    address: 'Jakarta',
    sex: EmployeeSex.FEMALE,
    birthDate: new Date('1990-01-01'),
    joinAt: new Date('2024-01-01'),
    leaveAt: null,
  } as Employee;

  const activePayroll = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
    employeeId: employee.id,
    accountNumber: '1234567890',
    accountName: 'Jane Doe',
    taxPercentage: 0.05,
    status: PayrollStatus.ACTIVE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Payroll;

  const createDto = {
    name: employee.name,
    email: employee.email,
    phoneNumber: employee.phoneNumber,
    address: employee.address,
    sex: employee.sex,
    birthDate: '1990-01-01',
    joinAt: '2024-01-01',
  };

  function mockFindOneResult(result: Employee | null) {
    repository.findOneWithActivePayroll.mockResolvedValue(result);
  }

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      save: vi.fn(),
      findAndCount: vi.fn(),
      findOneBy: vi.fn(),
      findOneWithActivePayroll: vi.fn(),
      merge: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create saves a new employee when the email is free', async () => {
    repository.findOneBy.mockResolvedValue(null);
    repository.create.mockReturnValue(employee);
    repository.save.mockResolvedValue(employee);

    await expect(service.create(createDto)).resolves.toBe(employee);
    expect(repository.save).toHaveBeenCalled();
  });

  it('create rejects a duplicate email', async () => {
    repository.findOneBy.mockResolvedValue(employee);
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('create maps a duplicate-key race to ConflictException', async () => {
    repository.findOneBy.mockResolvedValue(null);
    repository.create.mockReturnValue(employee);
    repository.save.mockRejectedValue({ code: '23505' });
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('findAll returns a paginated envelope of index resources', async () => {
    repository.findAndCount.mockResolvedValue([[employee], 1]);
    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: employee.id,
          name: employee.name,
          email: employee.email,
        }),
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(repository.findAndCount).toHaveBeenCalled();
  });

  it('findAll maps one resource per employee', async () => {
    repository.findAndCount.mockResolvedValue([[employee, employee], 2]);
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).not.toHaveProperty('payrolls');
    expect(result.data[0]).not.toHaveProperty('activePayroll');
  });

  it('findOne delegates to the repository custom query', async () => {
    mockFindOneResult({ ...employee, payrolls: [] });
    await expect(service.findOne(employee.id)).resolves.toMatchObject({
      id: employee.id,
      email: employee.email,
      activePayroll: null,
    });
    expect(repository.findOneWithActivePayroll).toHaveBeenCalledWith(
      employee.id,
    );
  });

  it('findOne embeds the active payroll when one exists', async () => {
    mockFindOneResult({ ...employee, payrolls: [activePayroll] });
    await expect(service.findOne(employee.id)).resolves.toMatchObject({
      id: employee.id,
      activePayroll: {
        id: activePayroll.id,
        employeeId: employee.id,
        accountNumber: activePayroll.accountNumber,
        accountName: activePayroll.accountName,
        status: PayrollStatus.ACTIVE,
      },
    });
  });

  it('findOne throws NotFoundException for unknown ids', async () => {
    mockFindOneResult(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update saves merged changes', async () => {
    repository.findOneBy.mockResolvedValue(employee);
    const updated = Object.assign({}, employee, { name: 'New Name' });
    repository.merge.mockReturnValue(updated);
    repository.save.mockResolvedValue(updated);

    await expect(
      service.update(employee.id, { name: 'New Name' }),
    ).resolves.toMatchObject({
      name: 'New Name',
    });
  });

  it('remove deletes the employee', async () => {
    repository.findOneBy.mockResolvedValue(employee);
    repository.remove.mockResolvedValue(employee);
    await expect(service.remove(employee.id)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(employee);
  });
});
