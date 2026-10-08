import { Expose } from 'class-transformer';
import { Payslip, PayslipStatus } from '#payslips/entities/payslip.entity.js';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class PayslipResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'employee_id' })
  employeeId: string;

  @Expose({ name: 'payroll_id' })
  payrollId: string;

  @Expose({ name: 'basic_salary' })
  basicSalary: number;

  @Expose({ name: 'overtime' })
  overtime: number;

  @Expose({ name: 'tax' })
  tax: number;

  @Expose({ name: 'bonus' })
  bonus: number;

  @Expose({ name: 'deduction' })
  deduction: number;

  @Expose({ name: 'date' })
  date: Date;

  @Expose({ name: 'status' })
  status: PayslipStatus;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  static fromEntity(payslip: Payslip): PayslipResourceDto {
    const resource = new PayslipResourceDto();
    resource.id = payslip.id;
    resource.employeeId = payslip.employeeId;
    resource.payrollId = payslip.payrollId;
    resource.basicSalary = payslip.basicSalary;
    resource.overtime = payslip.overtime;
    resource.tax = payslip.tax;
    resource.bonus = payslip.bonus;
    resource.deduction = payslip.deduction;
    resource.date = payslip.date;
    resource.status = payslip.status;
    resource.createdAt = payslip.createdAt;
    resource.updatedAt = payslip.updatedAt;
    return resource;
  }
}
