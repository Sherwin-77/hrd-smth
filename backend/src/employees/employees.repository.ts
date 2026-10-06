import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { PayrollStatus } from '#payrolls/entities/payroll.entity.js';

@Injectable()
export class EmployeesRepository extends Repository<Employee> {
  constructor(private readonly dataSource: DataSource) {
    super(Employee, dataSource.createEntityManager());
  }

  /**
   * Base query builder with the employee's `activePayroll` mapped from
   * `payrolls` (status `active`). Shared by the detail and index queries
   * so the join condition stays in one place.
   */
  createQueryBuilderWithActivePayroll(
    alias = 'employee',
  ): SelectQueryBuilder<Employee> {
    return this.createQueryBuilder(alias).leftJoinAndMapOne(
      `${alias}.activePayroll`,
      `${alias}.payrolls`,
      'payroll',
      'payroll.status = :activeStatus',
      { activeStatus: PayrollStatus.ACTIVE },
    );
  }

  findOneWithActivePayroll(id: string): Promise<Employee | null> {
    return this.createQueryBuilderWithActivePayroll('employee')
      .where('employee.id = :id', { id })
      .getOne();
  }

  /**
   * Full detail query for the employee show endpoint: active payroll plus
   * the employee's payslips (survive payroll deletion, linked directly
   * via `payslip.employeeId`).
   */
  findOneDetail(id: string): Promise<Employee | null> {
    return this.createQueryBuilderWithActivePayroll('employee')
      .leftJoinAndSelect('employee.payslips', 'payslip')
      .where('employee.id = :id', { id })
      .getOne();
  }

  /**
   * Load an employee with its payrolls and payslips so that
   * `softRemove`/`recover` can cascade through both direct relations.
   * Payslips are linked via `payslip.employeeId` and survive payroll
   * deletion — they are only removed when the employee itself is removed.
   * Soft-deleted rows are excluded unless `withDeleted` is set.
   */
  findOneWithRelations(
    id: string,
    withDeleted = false,
  ): Promise<Employee | null> {
    return this.findOne({
      where: { id },
      relations: { payrolls: true, payslips: true },
      withDeleted,
    });
  }
}
