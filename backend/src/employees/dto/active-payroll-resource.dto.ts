import {
  Payroll,
  PayrollStatus,
} from '../../payrolls/entities/payroll.entity.js';

export class ActivePayrollResourceDto {
  id: string;
  employeeId: string;
  accountNumber: string;
  accountName: string;
  taxPercentage: number;
  status: PayrollStatus;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(payroll: Payroll): ActivePayrollResourceDto {
    const resource = new ActivePayrollResourceDto();
    resource.id = payroll.id;
    resource.employeeId = payroll.employeeId;
    resource.accountNumber = payroll.accountNumber;
    resource.accountName = payroll.accountName;
    resource.taxPercentage = payroll.taxPercentage;
    resource.status = payroll.status;
    resource.createdAt = payroll.createdAt;
    resource.updatedAt = payroll.updatedAt;
    return resource;
  }
}
