import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { PayrollStatus } from '../payrolls/entities/payroll.entity.js';

@Injectable()
export class EmployeesRepository extends Repository<Employee> {
  constructor(private readonly dataSource: DataSource) {
    super(Employee, dataSource.createEntityManager());
  }

  /**
   * Loads a single employee together with its active payroll, if any.
   * The join is filtered to `payroll.status = 'active'`, so the
   * returned `payrolls` holds at most one record by invariant.
   */
  findOneWithActivePayroll(id: string): Promise<Employee | null> {
    return this.createQueryBuilder('employee')
      .leftJoinAndSelect(
        'employee.payrolls',
        'payroll',
        'payroll.status = :activeStatus',
        { activeStatus: PayrollStatus.ACTIVE },
      )
      .where('employee.id = :id', { id })
      .getOne();
  }
}
