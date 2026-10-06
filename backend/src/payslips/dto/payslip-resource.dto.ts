import { Payslip, PayslipStatus } from '#payslips/entities/payslip.entity.js';

export class PayslipResourceDto {
  id: string;
  employeeId: string;
  payrollId: string;
  basicSalary: number;
  overtime: number;
  tax: number;
  bonus: number;
  deduction: number;
  date: Date;
  status: PayslipStatus;
  createdAt: Date;
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
