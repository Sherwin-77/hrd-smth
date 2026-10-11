import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { PayslipsService } from './payslips.service.js';
import { Payslip, PayslipStatus } from './entities/payslip.entity.js';
import { Payroll } from '#payrolls/entities/payroll.entity.js';

describe('PayslipsService', () => {
  let service: PayslipsService;
  let payslips: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
    softRemove: ReturnType<typeof vi.fn>;
    recover: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let payrolls: {
    findOne: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
  };

  const payrollId = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d';
  const employeeId = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c';
  const payslipData = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
    employeeId,
    payrollId,
    basicSalary: 5000,
    overtime: 100,
    tax: 250,
    bonus: 0,
    deduction: 0,
    date: new Date('2026-01-31'),
    status: PayslipStatus.PENDING,
  };
  const payslip = payslipData as Payslip;

  const createDto = {
    payrollId,
    basicSalary: 5000,
    overtime: 100,
    tax: 250,
    bonus: 0,
    deduction: 0,
    date: '2026-01-31',
  };

  beforeEach(async () => {
    payslips = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      merge: vi.fn(),
      softRemove: vi.fn(),
      recover: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    payrolls = {
      findOne: vi.fn(),
      findOneBy: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipsService,
        { provide: getRepositoryToken(Payslip), useValue: payslips },
        { provide: getRepositoryToken(Payroll), useValue: payrolls },
      ],
    }).compile();

    service = module.get<PayslipsService>(PayslipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws NotFoundException when the payroll is missing', async () => {
    payrolls.findOne.mockResolvedValue(null);
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('create always starts as pending', async () => {
    payrolls.findOne.mockResolvedValue({ id: payrollId, employeeId });
    const pending = { ...payslipData, status: PayslipStatus.PENDING };
    payslips.create.mockReturnValue(pending);
    payslips.save.mockResolvedValue(pending);

    await expect(service.create(createDto)).resolves.toMatchObject({
      status: PayslipStatus.PENDING,
    });
    expect(payslips.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId,
        payrollId,
        status: PayslipStatus.PENDING,
      }),
    );
  });

  it('create binds employeeId from the payroll', async () => {
    payrolls.findOne.mockResolvedValue({ id: payrollId, employeeId });
    payslips.create.mockReturnValue(payslipData);
    payslips.save.mockResolvedValue(payslipData);

    await expect(service.create(createDto)).resolves.toMatchObject({
      employeeId,
      payrollId,
    });
    expect(payslips.create).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId }),
    );
  });

  it('create embeds the employee brief from the payroll', async () => {
    const employee = {
      id: employeeId,
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    payrolls.findOne.mockResolvedValue({ id: payrollId, employeeId, employee });
    payslips.create.mockReturnValue(payslipData);
    payslips.save.mockResolvedValue(payslipData);

    await expect(service.create(createDto)).resolves.toMatchObject({
      employee: { id: employeeId, name: 'Jane Doe' },
    });
    expect(payrolls.findOne).toHaveBeenCalledWith({
      where: { id: payrollId },
      relations: { employee: true },
    });
  });

  it('findOne throws NotFoundException for unknown ids', async () => {
    payslips.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne loads the employee relation and embeds the brief', async () => {
    const employee = {
      id: employeeId,
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    payslips.findOne.mockResolvedValue({ ...payslipData, employee });
    const result = await service.findOne(payslip.id);
    expect(payslips.findOne).toHaveBeenCalledWith({
      where: { id: payslip.id },
      relations: { employee: true },
    });
    expect(result).toMatchObject({
      employee: { id: employeeId, name: 'Jane Doe' },
    });
  });

  it('findAll joins employee and payroll and searches both', async () => {
    const qb = {
      leftJoinAndSelect: vi.fn(),
      leftJoin: vi.fn(),
      andWhere: vi.fn(),
      orderBy: vi.fn(),
      skip: vi.fn(),
      take: vi.fn(),
      getManyAndCount: vi.fn(),
    };
    qb.leftJoinAndSelect.mockReturnValue(qb);
    qb.leftJoin.mockReturnValue(qb);
    qb.andWhere.mockReturnValue(qb);
    qb.orderBy.mockReturnValue(qb);
    qb.skip.mockReturnValue(qb);
    qb.take.mockReturnValue(qb);
    const employee = {
      id: employeeId,
      name: 'Jane Doe',
      email: 'jane@example.com',
    };
    qb.getManyAndCount.mockResolvedValue([[{ ...payslipData, employee }], 1]);
    payslips.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({ search: 'jane' });

    expect(payslips.createQueryBuilder).toHaveBeenCalledWith('payslip');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
      'payslip.employee',
      'employee',
    );
    expect(qb.leftJoin).toHaveBeenCalledWith('payslip.payroll', 'payroll');
    expect(result.data[0]).toMatchObject({
      employee: { id: employeeId, name: 'Jane Doe' },
    });
    expect(result.meta).toMatchObject({ total: 1 });
  });

  it('update saves merged changes on a pending payslip', async () => {
    payslips.findOne.mockResolvedValue({ ...payslipData });
    const updated = { ...payslipData, bonus: 500 };
    payslips.merge.mockReturnValue(updated);
    payslips.save.mockResolvedValue(updated);

    await expect(
      service.update(payslip.id, { bonus: 500 }),
    ).resolves.toMatchObject({ bonus: 500 });
    expect(payslips.merge).toHaveBeenCalled();
  });

  it('update rejects non-pending payslips', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.APPROVED,
    });
    await expect(
      service.update(payslip.id, { bonus: 500 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('approve flips a pending payslip to approved', async () => {
    payslips.findOne.mockResolvedValue({ ...payslipData });
    payslips.save.mockImplementation((entity: Payslip) =>
      Promise.resolve(entity),
    );
    await expect(service.approve(payslip.id)).resolves.toMatchObject({
      status: PayslipStatus.APPROVED,
    });
  });

  it('approve returns the payslip untouched when already approved', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.APPROVED,
    });
    await expect(service.approve(payslip.id)).resolves.toMatchObject({
      status: PayslipStatus.APPROVED,
    });
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('approve rejects an already-rejected payslip', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.REJECTED,
    });
    await expect(service.approve(payslip.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('reject flips a pending payslip to rejected', async () => {
    payslips.findOne.mockResolvedValue({ ...payslipData });
    payslips.save.mockImplementation((entity: Payslip) =>
      Promise.resolve(entity),
    );
    await expect(service.reject(payslip.id)).resolves.toMatchObject({
      status: PayslipStatus.REJECTED,
    });
  });

  it('reject returns the payslip untouched when already rejected', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.REJECTED,
    });
    await expect(service.reject(payslip.id)).resolves.toMatchObject({
      status: PayslipStatus.REJECTED,
    });
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('reject rejects an already-approved payslip', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.APPROVED,
    });
    await expect(service.reject(payslip.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(payslips.save).not.toHaveBeenCalled();
  });

  it('remove soft-deletes the payslip', async () => {
    payslips.findOne.mockResolvedValue(payslip);
    payslips.softRemove.mockResolvedValue(payslip);
    await expect(service.remove(payslip.id)).resolves.toBeUndefined();
    expect(payslips.softRemove).toHaveBeenCalledWith(payslip);
  });

  it('remove rejects approved payslips', async () => {
    payslips.findOne.mockResolvedValue({
      ...payslipData,
      status: PayslipStatus.APPROVED,
    });
    await expect(service.remove(payslip.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(payslips.softRemove).not.toHaveBeenCalled();
  });

  it('remove throws NotFoundException for unknown ids', async () => {
    payslips.findOne.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payslips.softRemove).not.toHaveBeenCalled();
  });

  it('restore recovers a soft-deleted payslip', async () => {
    const deleted = { ...payslipData, deletedAt: new Date() };
    payslips.findOne.mockResolvedValue(deleted);
    payslips.recover.mockResolvedValue(payslip);
    await expect(service.restore(payslip.id)).resolves.toMatchObject({
      id: payslip.id,
      employeeId,
      payrollId,
      status: PayslipStatus.PENDING,
    });
    expect(payslips.findOne).toHaveBeenCalledWith({
      where: { id: payslip.id },
      relations: { employee: true },
      withDeleted: true,
    });
    expect(payslips.recover).toHaveBeenCalledWith(deleted);
  });

  it('restore returns the payslip untouched when not deleted', async () => {
    payslips.findOne.mockResolvedValue({ ...payslipData, deletedAt: null });
    await expect(service.restore(payslip.id)).resolves.toMatchObject({
      id: payslip.id,
    });
    expect(payslips.recover).not.toHaveBeenCalled();
  });

  it('restore throws NotFoundException for unknown ids', async () => {
    payslips.findOne.mockResolvedValue(null);
    await expect(service.restore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payslips.recover).not.toHaveBeenCalled();
  });

  it('getStatuses returns all payslip statuses with labels', () => {
    expect(service.getStatuses()).toEqual([
      { value: PayslipStatus.PENDING, label: 'Pending' },
      { value: PayslipStatus.APPROVED, label: 'Approved' },
      { value: PayslipStatus.REJECTED, label: 'Rejected' },
    ]);
  });

  it('simulate computes the total without touching the database', () => {
    const result = service.simulate({
      basicSalary: 5000,
      overtime: 100,
      tax: 250,
      bonus: 0,
      deduction: 0,
    });
    expect(result).toEqual({
      basicSalary: 5000,
      overtime: 100,
      tax: 250,
      bonus: 0,
      deduction: 0,
      total: 4850,
    });
    expect(payslips.create).not.toHaveBeenCalled();
    expect(payslips.save).not.toHaveBeenCalled();
    expect(payrolls.findOneBy).not.toHaveBeenCalled();
  });

  it('simulate defaults missing amounts to zero', () => {
    expect(service.simulate({ basicSalary: 5000 })).toEqual({
      basicSalary: 5000,
      overtime: 0,
      tax: 0,
      bonus: 0,
      deduction: 0,
      total: 5000,
    });
  });

  it('simulate rounds the total to two decimals', () => {
    expect(
      service.simulate({ basicSalary: 1000.555, overtime: 0.005 }).total,
    ).toBe(1000.56);
  });
});
