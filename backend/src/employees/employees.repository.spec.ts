import { vi } from 'vitest';
import { EmployeesRepository } from './employees.repository.js';
import { Employee } from './entities/employee.entity.js';
import { PayrollStatus } from '../payrolls/entities/payroll.entity.js';

describe('EmployeesRepository', () => {
  let repository: EmployeesRepository;
  let queryBuilder: {
    leftJoinAndSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const dataSource = {
      createEntityManager: vi.fn().mockReturnValue({}),
    };
    repository = new EmployeesRepository(dataSource as any);

    queryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn(),
    };
    vi.spyOn(repository, 'createQueryBuilder').mockReturnValue(
      queryBuilder as any,
    );
  });

  it('findOneWithActivePayroll joins only the active payroll scoped by id', async () => {
    const employee = { id: 'employee-id' } as Employee;
    queryBuilder.getOne.mockResolvedValue(employee);

    await expect(
      repository.findOneWithActivePayroll('employee-id'),
    ).resolves.toBe(employee);

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('employee');
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
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
});
