import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { PayrollsService } from './payrolls.service.js';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';

describe('PayrollsService', () => {
  let service: PayrollsService;
  let payrolls: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
    softRemove: ReturnType<typeof vi.fn>;
    recover: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let employees: {
    findOneBy: ReturnType<typeof vi.fn>;
  };

  const employeeId = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d';
  const payrollData = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
    employeeId,
    accountNumber: '1234567890',
    accountName: 'Jane Doe',
    taxPercentage: 0.05,
    status: PayrollStatus.ACTIVE,
  };
  const payroll = payrollData as Payroll;

  const createDto = {
    employeeId,
    accountNumber: '1234567890',
    accountName: 'Jane Doe',
    taxPercentage: 0.05,
  };

  beforeEach(async () => {
    payrolls = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      merge: vi.fn(),
      softRemove: vi.fn(),
      recover: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    employees = {
      findOneBy: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollsService,
        { provide: getRepositoryToken(Payroll), useValue: payrolls },
        { provide: getRepositoryToken(Employee), useValue: employees },
      ],
    }).compile();

    service = module.get<PayrollsService>(PayrollsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws NotFoundException when the employee is missing', async () => {
    employees.findOneBy.mockResolvedValue(null);
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payrolls.save).not.toHaveBeenCalled();
  });

  it('create rejects a second active payroll for the same employee', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    payrolls.findOneBy.mockResolvedValue(payroll);
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(payrolls.save).not.toHaveBeenCalled();
  });

  it('create always creates an active payroll and checks for conflicts', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    payrolls.findOneBy.mockResolvedValue(null);
    payrolls.create.mockReturnValue(payroll);
    payrolls.save.mockResolvedValue(payroll);

    await expect(service.create(createDto)).resolves.toMatchObject({
      id: payroll.id,
      employeeId,
      status: PayrollStatus.ACTIVE,
    });
    expect(payrolls.findOneBy).toHaveBeenCalled();
    expect(payrolls.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: PayrollStatus.ACTIVE }),
    );
  });

  it('create maps a unique-violation race to ConflictException', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    payrolls.findOneBy.mockResolvedValue(null);
    payrolls.create.mockReturnValue(payroll);
    payrolls.save.mockRejectedValue({ code: '23505' });
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('findOne throws NotFoundException for unknown ids', async () => {
    payrolls.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update saves merged changes without touching status', async () => {
    payrolls.findOneBy.mockResolvedValue(payroll);
    const updated = { ...payrollData, accountName: 'New Name' };
    payrolls.merge.mockReturnValue(updated);
    payrolls.save.mockResolvedValue(updated);

    await expect(
      service.update(payroll.id, { accountName: 'New Name' }),
    ).resolves.toMatchObject({ accountName: 'New Name' });
    expect(payrolls.merge).toHaveBeenCalled();
  });

  it('activate returns the payroll untouched when already active', async () => {
    payrolls.findOneBy.mockResolvedValue({ ...payrollData });
    await expect(service.activate(payroll.id)).resolves.toMatchObject({
      status: PayrollStatus.ACTIVE,
    });
    expect(payrolls.save).not.toHaveBeenCalled();
  });

  it('activate rejects when another active payroll exists', async () => {
    const inactive = { ...payrollData, status: PayrollStatus.INACTIVE };
    payrolls.findOneBy.mockImplementation((where: Record<string, unknown>) => {
      if ('employeeId' in where) return payroll;
      return inactive;
    });
    await expect(service.activate(inactive.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(payrolls.save).not.toHaveBeenCalled();
  });

  it('activate flips an inactive payroll with no rival active', async () => {
    const inactive = { ...payrollData, status: PayrollStatus.INACTIVE };
    payrolls.findOneBy.mockImplementation((where: Record<string, unknown>) => {
      if ('employeeId' in where) return null;
      return inactive;
    });
    payrolls.save.mockImplementation((entity: Payroll) =>
      Promise.resolve(entity),
    );
    await expect(service.activate(inactive.id)).resolves.toMatchObject({
      status: PayrollStatus.ACTIVE,
    });
  });

  it('deactivate returns the payroll untouched when already inactive', async () => {
    const inactive = { ...payrollData, status: PayrollStatus.INACTIVE };
    payrolls.findOneBy.mockResolvedValue({ ...inactive });
    await expect(service.deactivate(payroll.id)).resolves.toMatchObject({
      status: PayrollStatus.INACTIVE,
    });
    expect(payrolls.save).not.toHaveBeenCalled();
  });

  it('remove soft-deletes only the payroll, leaving payslips intact', async () => {
    payrolls.findOneBy.mockResolvedValue(payroll);
    payrolls.softRemove.mockResolvedValue(payroll);
    await expect(service.remove(payroll.id)).resolves.toBeUndefined();
    expect(payrolls.findOneBy).toHaveBeenCalledWith({ id: payroll.id });
    expect(payrolls.findOne).not.toHaveBeenCalled();
    expect(payrolls.softRemove).toHaveBeenCalledWith(payroll);
  });

  it('remove throws NotFoundException for unknown ids', async () => {
    payrolls.findOneBy.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payrolls.softRemove).not.toHaveBeenCalled();
  });

  it('restore recovers a soft-deleted payroll', async () => {
    const deleted = { ...payrollData, deletedAt: new Date() };
    payrolls.findOne.mockResolvedValue(deleted);
    payrolls.recover.mockResolvedValue(payroll);
    await expect(service.restore(payroll.id)).resolves.toMatchObject({
      id: payroll.id,
      employeeId,
    });
    expect(payrolls.findOne).toHaveBeenCalledWith({
      where: { id: payroll.id },
      withDeleted: true,
    });
    expect(payrolls.recover).toHaveBeenCalledWith(deleted);
  });

  it('restore returns the payroll untouched when not deleted', async () => {
    payrolls.findOne.mockResolvedValue({ ...payrollData, deletedAt: null });
    await expect(service.restore(payroll.id)).resolves.toMatchObject({
      id: payroll.id,
    });
    expect(payrolls.recover).not.toHaveBeenCalled();
  });

  it('restore throws NotFoundException for unknown ids', async () => {
    payrolls.findOne.mockResolvedValue(null);
    await expect(service.restore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payrolls.recover).not.toHaveBeenCalled();
  });
});
