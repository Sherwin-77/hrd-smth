import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { vi } from 'vitest';
import { ContractsService } from './contracts.service.js';
import {
  Contract,
  ContractStatus,
  ContractType,
} from './entities/contract.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';

describe('ContractsService', () => {
  let service: ContractsService;
  let contracts: {
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

  const employeeId = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c';
  const contractData = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e',
    employeeId,
    type: ContractType.FIXED_TIME,
    title: 'Software Engineer',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    signedDate: null,
    status: ContractStatus.PENDING,
  };
  const contract = contractData as unknown as Contract;

  const createDto = {
    employeeId,
    type: ContractType.FIXED_TIME,
    title: 'Software Engineer',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  };

  /** Chainable overlap query builder; defaults to "no overlap". */
  const mockNoOverlap = () => {
    const qb: {
      where: ReturnType<typeof vi.fn>;
      andWhere: ReturnType<typeof vi.fn>;
      getOne: ReturnType<typeof vi.fn>;
    } = {
      where: vi.fn(),
      andWhere: vi.fn(),
      getOne: vi.fn(),
    };
    qb.where.mockReturnValue(qb);
    qb.andWhere.mockReturnValue(qb);
    qb.getOne.mockResolvedValue(null);
    contracts.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  const mockOverlap = (existing: unknown) => {
    const qb = mockNoOverlap();
    qb.getOne.mockResolvedValue(existing);
    return qb;
  };

  beforeEach(async () => {
    contracts = {
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
        ContractsService,
        { provide: getRepositoryToken(Contract), useValue: contracts },
        { provide: getRepositoryToken(Employee), useValue: employees },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    mockNoOverlap();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws NotFoundException when the employee is missing', async () => {
    employees.findOneBy.mockResolvedValue(null);
    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('create always starts as pending with no signed date', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    const pending = { ...contractData, status: ContractStatus.PENDING };
    contracts.create.mockReturnValue(pending);
    contracts.save.mockResolvedValue(pending);

    await expect(service.create(createDto)).resolves.toMatchObject({
      status: ContractStatus.PENDING,
      signedDate: null,
    });
    expect(contracts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId,
        status: ContractStatus.PENDING,
        signedDate: null,
      }),
    );
  });

  it('create rejects an end date before the start date', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    await expect(
      service.create({
        ...createDto,
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('create scopes the overlap check to live contracts of the employee', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    const qb = mockNoOverlap();
    contracts.create.mockReturnValue(contractData);
    contracts.save.mockResolvedValue(contractData);

    await service.create(createDto);

    expect(contracts.createQueryBuilder).toHaveBeenCalledWith('contract');
    expect(qb.where).toHaveBeenCalledWith('contract.employeeId = :employeeId', {
      employeeId,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'contract.status IN (:...statuses)',
      { statuses: [ContractStatus.PENDING, ContractStatus.SIGNED] },
    );
  });

  it('create throws ConflictException when dates overlap a live contract', async () => {
    employees.findOneBy.mockResolvedValue({ id: employeeId });
    mockOverlap({ ...contractData, id: 'other-id' });

    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('findOne throws NotFoundException for unknown ids', async () => {
    contracts.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update saves merged changes on a pending contract', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    const updated = { ...contractData, title: 'Senior Engineer' };
    contracts.merge.mockReturnValue(updated);
    contracts.save.mockResolvedValue(updated);

    await expect(
      service.update(contract.id, { title: 'Senior Engineer' }),
    ).resolves.toMatchObject({ title: 'Senior Engineer' });
    expect(contracts.merge).toHaveBeenCalled();
  });

  it('update rejects non-pending contracts', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.SIGNED,
    });
    await expect(
      service.update(contract.id, { title: 'Senior Engineer' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('update rejects an end date before the start date', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    await expect(
      service.update(contract.id, { endDate: '2025-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('update throws ConflictException when dates overlap another contract', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    const qb = mockOverlap({ ...contractData, id: 'other-id' });

    await expect(
      service.update(contract.id, { endDate: '2027-06-30' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(qb.andWhere).toHaveBeenCalledWith('contract.id != :excludeId', {
      excludeId: contract.id,
    });
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('sign flips a pending contract to signed with the given date', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    contracts.save.mockImplementation((entity: Contract) =>
      Promise.resolve(entity),
    );
    await expect(
      service.sign(contract.id, { signedDate: '2026-02-01' }),
    ).resolves.toMatchObject({
      status: ContractStatus.SIGNED,
      signedDate: new Date('2026-02-01'),
    });
  });

  it('sign defaults the signed date to today', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    contracts.save.mockImplementation((entity: Contract) =>
      Promise.resolve(entity),
    );
    const today = new Date().toISOString().slice(0, 10);
    await expect(service.sign(contract.id, {})).resolves.toMatchObject({
      status: ContractStatus.SIGNED,
    });
    const saved = contracts.save.mock.calls[0][0] as Contract;
    expect(saved.signedDate).toBeInstanceOf(Date);
    expect((saved.signedDate as Date).toISOString().slice(0, 10)).toBe(today);
  });

  it('sign returns the contract untouched when already signed', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.SIGNED,
      signedDate: new Date('2026-02-01'),
    });
    await expect(service.sign(contract.id, {})).resolves.toMatchObject({
      status: ContractStatus.SIGNED,
    });
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('sign rejects declined and voided contracts', async () => {
    for (const status of [ContractStatus.DECLINED, ContractStatus.VOIDED]) {
      contracts.findOneBy.mockResolvedValue({ ...contractData, status });
      await expect(service.sign(contract.id, {})).rejects.toBeInstanceOf(
        ConflictException,
      );
    }
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('decline flips a pending contract to declined', async () => {
    contracts.findOneBy.mockResolvedValue({ ...contractData });
    contracts.save.mockImplementation((entity: Contract) =>
      Promise.resolve(entity),
    );
    await expect(service.decline(contract.id)).resolves.toMatchObject({
      status: ContractStatus.DECLINED,
    });
  });

  it('decline returns the contract untouched when already declined', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.DECLINED,
    });
    await expect(service.decline(contract.id)).resolves.toMatchObject({
      status: ContractStatus.DECLINED,
    });
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('decline rejects signed and voided contracts', async () => {
    for (const status of [ContractStatus.SIGNED, ContractStatus.VOIDED]) {
      contracts.findOneBy.mockResolvedValue({ ...contractData, status });
      await expect(service.decline(contract.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    }
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('void flips a signed contract to voided', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.SIGNED,
      signedDate: new Date('2026-02-01'),
    });
    contracts.save.mockImplementation((entity: Contract) =>
      Promise.resolve(entity),
    );
    await expect(service.void(contract.id)).resolves.toMatchObject({
      status: ContractStatus.VOIDED,
    });
  });

  it('void returns the contract untouched when already voided', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.VOIDED,
    });
    await expect(service.void(contract.id)).resolves.toMatchObject({
      status: ContractStatus.VOIDED,
    });
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('void rejects pending and declined contracts', async () => {
    for (const status of [ContractStatus.PENDING, ContractStatus.DECLINED]) {
      contracts.findOneBy.mockResolvedValue({ ...contractData, status });
      await expect(service.void(contract.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    }
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('remove soft-deletes the contract', async () => {
    contracts.findOneBy.mockResolvedValue(contract);
    contracts.softRemove.mockResolvedValue(contract);
    await expect(service.remove(contract.id)).resolves.toBeUndefined();
    expect(contracts.softRemove).toHaveBeenCalledWith(contract);
  });

  it('remove rejects signed contracts', async () => {
    contracts.findOneBy.mockResolvedValue({
      ...contractData,
      status: ContractStatus.SIGNED,
    });
    await expect(service.remove(contract.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(contracts.softRemove).not.toHaveBeenCalled();
  });

  it('remove throws NotFoundException for unknown ids', async () => {
    contracts.findOneBy.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(contracts.softRemove).not.toHaveBeenCalled();
  });

  it('restore recovers a soft-deleted contract', async () => {
    const deleted = { ...contractData, deletedAt: new Date() };
    contracts.findOne.mockResolvedValue(deleted);
    contracts.recover.mockResolvedValue(contract);
    await expect(service.restore(contract.id)).resolves.toMatchObject({
      id: contract.id,
      employeeId,
      status: ContractStatus.PENDING,
    });
    expect(contracts.findOne).toHaveBeenCalledWith({
      where: { id: contract.id },
      withDeleted: true,
    });
    expect(contracts.recover).toHaveBeenCalledWith(deleted);
  });

  it('restore returns the contract untouched when not deleted', async () => {
    contracts.findOne.mockResolvedValue({ ...contractData, deletedAt: null });
    await expect(service.restore(contract.id)).resolves.toMatchObject({
      id: contract.id,
    });
    expect(contracts.recover).not.toHaveBeenCalled();
  });

  it('restore throws ConflictException when dates overlap a live contract', async () => {
    const deleted = { ...contractData, deletedAt: new Date() };
    contracts.findOne.mockResolvedValue(deleted);
    const qb = mockOverlap({ ...contractData, id: 'other-id' });

    await expect(service.restore(contract.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(qb.andWhere).toHaveBeenCalledWith('contract.id != :excludeId', {
      excludeId: contract.id,
    });
    expect(contracts.recover).not.toHaveBeenCalled();
  });

  it('restore throws NotFoundException for unknown ids', async () => {
    contracts.findOne.mockResolvedValue(null);
    await expect(service.restore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(contracts.recover).not.toHaveBeenCalled();
  });

  it('getTypes returns all contract types with labels', () => {
    expect(service.getTypes()).toEqual([
      { value: ContractType.PERMANENT, label: 'Permanent' },
      { value: ContractType.FIXED_TIME, label: 'Fixed time' },
    ]);
  });

  it('getStatuses returns all contract statuses with labels', () => {
    expect(service.getStatuses()).toEqual([
      { value: ContractStatus.PENDING, label: 'Pending' },
      { value: ContractStatus.SIGNED, label: 'Signed' },
      { value: ContractStatus.DECLINED, label: 'Declined' },
      { value: ContractStatus.VOIDED, label: 'Voided' },
    ]);
  });
});
