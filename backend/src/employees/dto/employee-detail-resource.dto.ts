import { Expose, Type } from 'class-transformer';
import type { Employee } from '../entities/employee.entity.js';
import { ContractResourceDto } from '#contracts/dto/contract-resource.dto.js';
import { PayrollResourceDto } from '#payrolls/dto/payroll-resource.dto.js';
import { PayslipResourceDto } from '#payslips/dto/payslip-resource.dto.js';
import { RoleResourceDto } from '#rbac/dto/role.dto.js';
import { EmployeeIndexResourceDto } from './employee-index-resource.dto.js';

export class EmployeeDetailResourceDto extends EmployeeIndexResourceDto {
  /**
   * The employee's payroll with status `active`, or `null` when the
   * employee has no active payroll
   */
  @Expose({ name: 'active_payroll' })
  @Type(() => PayrollResourceDto)
  activePayroll: PayrollResourceDto | null;

  @Expose({ name: 'contracts' })
  @Type(() => ContractResourceDto)
  contracts: ContractResourceDto[];

  /** Payslips linked directly to the employee via `payslip.employeeId`. */
  @Expose({ name: 'payslips' })
  @Type(() => PayslipResourceDto)
  payslips: PayslipResourceDto[];

  /**
   * Effective permission names (union across roles). Only populated on
   * `GET /auth/me`; empty elsewhere.
   */
  @Expose({ name: 'permissions' })
  permissions: string[] = [];

  /** Assigned roles. Only populated on `GET /auth/me`; empty elsewhere. */
  @Expose({ name: 'roles' })
  @Type(() => RoleResourceDto)
  roles: RoleResourceDto[] = [];

  /**
   * Whether the employee holds the system superadmin role (which bypasses
   * permission checks). Only populated on `GET /auth/me`; false elsewhere.
   */
  @Expose({ name: 'is_superadmin' })
  isSuperadmin = false;

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
    resource.contracts = (employee.contracts ?? []).map((contract) =>
      ContractResourceDto.fromEntity(contract),
    );
    resource.payslips = (employee.payslips ?? []).map((payslip) =>
      PayslipResourceDto.fromEntity(payslip),
    );

    return resource;
  }
}
