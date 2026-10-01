import { PayrollStatus } from '../../payrolls/entities/payroll.entity.js';
import type { Employee } from '../entities/employee.entity.js';
import { ActivePayrollResourceDto } from './active-payroll-resource.dto.js';
import { EmployeeIndexResourceDto } from './employee-index-resource.dto.js';

export class EmployeeDetailResourceDto extends EmployeeIndexResourceDto {
  /**
   * The employee's payroll with status `active`, or `null` when the
   * employee has no active payroll. At most one active payroll exists
   * per employee, so this is a single object (not a list).
   */
  activePayroll: ActivePayrollResourceDto | null;

  static override fromEntity(employee: Employee): EmployeeDetailResourceDto {
    const resource = new EmployeeDetailResourceDto();
    resource.id = employee.id;
    resource.name = employee.name;
    resource.email = employee.email;
    resource.phoneNumber = employee.phoneNumber;
    resource.address = employee.address;
    resource.sex = employee.sex;
    resource.birthDate = employee.birthDate;
    resource.joinAt = employee.joinAt;
    resource.leaveAt = employee.leaveAt;
    resource.createdAt = employee.createdAt;
    resource.updatedAt = employee.updatedAt;

    // The repository left-joins only active payrolls, so `payrolls`
    // contains at most one record by invariant.
    const activePayroll = (employee.payrolls ?? []).find(
      (payroll) => payroll.status === PayrollStatus.ACTIVE,
    );
    resource.activePayroll = activePayroll
      ? ActivePayrollResourceDto.fromEntity(activePayroll)
      : null;

    return resource;
  }
}
