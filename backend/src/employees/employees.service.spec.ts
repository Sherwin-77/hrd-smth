import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasher } from '@nestjs/authentication';
import { vi } from 'vitest';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { Employee, EmployeeSex } from './entities/employee.entity.js';
import { Payroll, PayrollStatus } from '#payrolls/entities/payroll.entity.js';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
    createQueryBuilderWithActivePayroll: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    findOneWithActivePayroll: ReturnType<typeof vi.fn>;
    findOneDetail: ReturnType<typeof vi.fn>;
    findOneWithRelations: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
    softRemove: ReturnType<typeof vi.fn>;
    recover: ReturnType<typeof vi.fn>;
  };

  const employeeData = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '08123456789',
    address: 'Jakarta',
    sex: EmployeeSex.FEMALE,
    birthDate: new Date('1990-01-01'),
    joinAt: new Date('2024-01-01'),
    leaveAt: null,
  };
  const employee = employeeData as Employee;

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
    password: 'supersecret1',
    phoneNumber: employee.phoneNumber,
    address: employee.address,
    sex: employee.sex,
    birthDate: '1990-01-01',
    joinAt: '2024-01-01',
  };

  function mockFindOneResult(result: Employee | null) {
    repository.findOneDetail.mockResolvedValue(result);
  }

  function mockQueryBuilderResult(rows: Employee[], total: number) {
    const qb = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([rows, total]),
    };
    repository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  function mockPayrollQueryBuilderResult(rows: Employee[], total: number) {
    const qb = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([rows, total]),
    };
    repository.createQueryBuilderWithActivePayroll.mockReturnValue(qb);
    return qb;
  }

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
      createQueryBuilderWithActivePayroll: vi.fn(),
      findOneBy: vi.fn(),
      findOneWithActivePayroll: vi.fn(),
      findOneDetail: vi.fn(),
      findOneWithRelations: vi.fn(),
      merge: vi.fn(),
      softRemove: vi.fn(),
      recover: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repository },
        { provide: PasswordHasher, useValue: new PasswordHasher({ logN: 10 }) },
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
    const qb = mockQueryBuilderResult([employee], 1);
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
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('employee');
    expect(qb.getManyAndCount).toHaveBeenCalled();
  });

  it('findAll maps one resource per employee', async () => {
    mockQueryBuilderResult([employee, employee], 2);
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).not.toHaveProperty('payrolls');
    expect(result.data[0]).not.toHaveProperty('activePayroll');
  });

  it('findOne delegates to the repository detail query', async () => {
    mockFindOneResult({
      ...employeeData,
      activePayroll: null,
      payslips: [],
    } as Employee);
    await expect(service.findOne(employee.id)).resolves.toMatchObject({
      id: employee.id,
      email: employee.email,
      activePayroll: null,
      payslips: [],
    });
    expect(repository.findOneDetail).toHaveBeenCalledWith(employee.id);
  });

  it('findOne embeds the active payroll when one exists', async () => {
    mockFindOneResult({
      ...employeeData,
      activePayroll,
      payslips: [],
    } as Employee);
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

  it('findOne embeds the employee payslips', async () => {
    const payslip = {
      id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9f',
      employeeId: employee.id,
      payrollId: activePayroll.id,
      basicSalary: 5000,
      overtime: 0,
      tax: 250,
      bonus: 0,
      deduction: 0,
      date: new Date('2026-01-31'),
      status: 'pending',
      createdAt: new Date('2026-01-31'),
      updatedAt: new Date('2026-01-31'),
    };
    mockFindOneResult({
      ...employeeData,
      activePayroll,
      payslips: [payslip],
    } as unknown as Employee);
    await expect(service.findOne(employee.id)).resolves.toMatchObject({
      id: employee.id,
      payslips: [{ id: payslip.id, employeeId: employee.id }],
    });
  });

  it('findAllWithActivePayroll returns a paginated envelope with payrolls mapped', async () => {
    const qb = mockPayrollQueryBuilderResult(
      [{ ...employeeData, activePayroll, payslips: [] } as Employee],
      1,
    );
    await expect(
      service.findAllWithActivePayroll({ page: 1, limit: 10 }),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: employee.id,
          activePayroll: expect.objectContaining({ id: activePayroll.id }),
        }),
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(repository.createQueryBuilderWithActivePayroll).toHaveBeenCalledWith(
      'employee',
    );
    expect(qb.getManyAndCount).toHaveBeenCalled();
  });

  it('findAllWithActivePayroll maps one resource per employee', async () => {
    const row = { ...employeeData, activePayroll, payslips: [] } as Employee;
    mockPayrollQueryBuilderResult([row, row], 2);
    const result = await service.findAllWithActivePayroll({
      page: 1,
      limit: 10,
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toHaveProperty('activePayroll');
  });

  it('findAllWithActivePayroll excludes employees without an active payroll', async () => {
    const qb = mockPayrollQueryBuilderResult([], 0);
    await service.findAllWithActivePayroll({ page: 1, limit: 10 });
    expect(qb.andWhere).toHaveBeenCalledWith('payroll.id IS NOT NULL');
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

  it('remove soft-deletes the employee with its relations', async () => {
    repository.findOneWithRelations.mockResolvedValue(employee);
    repository.softRemove.mockResolvedValue(employee);
    await expect(service.remove(employee.id)).resolves.toBeUndefined();
    expect(repository.findOneWithRelations).toHaveBeenCalledWith(employee.id);
    expect(repository.softRemove).toHaveBeenCalledWith(employee);
  });

  it('remove throws NotFoundException for unknown ids', async () => {
    repository.findOneWithRelations.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.softRemove).not.toHaveBeenCalled();
  });

  it('restore recovers a soft-deleted employee', async () => {
    const deleted = { ...employeeData, deletedAt: new Date() };
    repository.findOneWithRelations.mockResolvedValue(deleted);
    repository.recover.mockResolvedValue(employee);
    await expect(service.restore(employee.id)).resolves.toBe(employee);
    expect(repository.findOneWithRelations).toHaveBeenCalledWith(
      employee.id,
      true,
    );
    expect(repository.recover).toHaveBeenCalledWith(deleted);
  });

  it('restore returns the employee untouched when not deleted', async () => {
    repository.findOneWithRelations.mockResolvedValue({
      ...employeeData,
      deletedAt: null,
    });
    await expect(service.restore(employee.id)).resolves.toMatchObject({
      id: employee.id,
    });
    expect(repository.recover).not.toHaveBeenCalled();
  });

  it('restore throws NotFoundException for unknown ids', async () => {
    repository.findOneWithRelations.mockResolvedValue(null);
    await expect(service.restore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.recover).not.toHaveBeenCalled();
  });
});
