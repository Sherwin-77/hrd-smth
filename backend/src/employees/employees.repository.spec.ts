import { vi } from 'vitest';
import { EmployeesRepository } from './employees.repository.js';
import { Employee } from './entities/employee.entity.js';
import { PayrollStatus } from '#payrolls/entities/payroll.entity.js';

describe('EmployeesRepository', () => {
  let repository: EmployeesRepository;
  let createQueryBuilderMock: ReturnType<typeof vi.spyOn>;
  let queryBuilder: {
    leftJoinAndMapOne: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const dataSource = {
      createEntityManager: vi.fn().mockReturnValue({}),
    };
    repository = new EmployeesRepository(dataSource as any);

    queryBuilder = {
      leftJoinAndMapOne: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn(),
    };
    createQueryBuilderMock = vi
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);
  });

  it('findOneWithActivePayroll joins only the active payroll scoped by id', async () => {
    const employee = { id: 'employee-id' } as Employee;
    queryBuilder.getOne.mockResolvedValue(employee);

    await expect(
      repository.findOneWithActivePayroll('employee-id'),
    ).resolves.toBe(employee);

    expect(createQueryBuilderMock).toHaveBeenCalledWith('employee');
    expect(queryBuilder.leftJoinAndMapOne).toHaveBeenCalledWith(
      'employee.activePayroll',
      'employee.payrolls',
      'payroll',
      'payroll.status = :activeStatus',
      { activeStatus: PayrollStatus.ACTIVE },
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('employee.id = :id', {
      id: 'employee-id',
    });
  });

  it('findOneWithActivePayroll returns null when the employee is missing', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(
      repository.findOneWithActivePayroll('missing'),
    ).resolves.toBeNull();
  });

  it('findOneWithRelations loads payrolls and payslips', async () => {
    const employee = { id: 'employee-id' } as Employee;
    const findOne = vi.spyOn(repository, 'findOne').mockResolvedValue(employee);

    await expect(repository.findOneWithRelations('employee-id')).resolves.toBe(
      employee,
    );
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'employee-id' },
      relations: { payrolls: { payslips: true } },
      withDeleted: false,
    });
  });

  it('findOneWithRelations includes soft-deleted rows when requested', async () => {
    const employee = { id: 'employee-id' } as Employee;
    const findOne = vi.spyOn(repository, 'findOne').mockResolvedValue(employee);

    await expect(
      repository.findOneWithRelations('employee-id', true),
    ).resolves.toBe(employee);
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'employee-id' },
      relations: { payrolls: { payslips: true } },
      withDeleted: true,
    });
  });
});
