import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { PayrollStatus } from '#payrolls/entities/payroll.entity.js';

@Injectable()
export class EmployeesRepository extends Repository<Employee> {
  constructor(private readonly dataSource: DataSource) {
    super(Employee, dataSource.createEntityManager());
  }

  findOneWithActivePayroll(id: string): Promise<Employee | null> {
    return this.createQueryBuilder('employee')
      .leftJoinAndMapOne(
        'employee.activePayroll',
        'employee.payrolls',
        'payroll',
        'payroll.status = :activeStatus',
        { activeStatus: PayrollStatus.ACTIVE },
      )
      .where('employee.id = :id', { id })
      .getOne();
  }

  /**
   * Load an employee with its payrolls and their payslips so that
   * `softRemove`/`recover` can cascade through the relations.
   * Soft-deleted rows are excluded unless `withDeleted` is set.
   */
  findOneWithRelations(
    id: string,
    withDeleted = false,
  ): Promise<Employee | null> {
    return this.findOne({
      where: { id },
      relations: { payrolls: { payslips: true } },
      withDeleted,
    });
  }
}
