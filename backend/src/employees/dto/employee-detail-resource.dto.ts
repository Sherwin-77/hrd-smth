import { Expose, Type } from 'class-transformer';
import type { Employee } from '../entities/employee.entity.js';
import { PayrollResourceDto } from '#payrolls/dto/payroll-resource.dto.js';
import { PayslipResourceDto } from '#payslips/dto/payslip-resource.dto.js';
import { EmployeeIndexResourceDto } from './employee-index-resource.dto.js';

export class EmployeeDetailResourceDto extends EmployeeIndexResourceDto {
  /**
   * The employee's payroll with status `active`, or `null` when the
   * employee has no active payroll
   */
  @Expose({ name: 'active_payroll' })
  @Type(() => PayrollResourceDto)
  activePayroll: PayrollResourceDto | null;

  /** Payslips linked directly to the employee via `payslip.employeeId`. */
  @Expose({ name: 'payslips' })
  @Type(() => PayslipResourceDto)
  payslips: PayslipResourceDto[];

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
      ? PayrollResourceDto.fromEntity(employee.activePayroll)
      : null;
    resource.payslips = (employee.payslips ?? []).map((payslip) =>
      PayslipResourceDto.fromEntity(payslip),
    );

    return resource;
  }
}
