import type { Employee } from '../entities/employee.entity.js';
import { ActivePayrollResourceDto } from '#/payrolls/dto/active-payroll-resource.dto.js';
import { EmployeeIndexResourceDto } from './employee-index-resource.dto.js';

export class EmployeeDetailResourceDto extends EmployeeIndexResourceDto {
  /**
   * The employee's payroll with status `active`, or `null` when the
   * employee has no active payroll
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
    resource.activePayroll = employee.activePayroll
      ? ActivePayrollResourceDto.fromEntity(employee.activePayroll)
      : null;

    return resource;
  }
}
