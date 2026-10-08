import { Expose } from 'class-transformer';
import {
  Payroll,
  PayrollStatus,
} from '#payrolls/entities/payroll.entity.js';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class PayrollResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'employee_id' })
  employeeId: string;

  @Expose({ name: 'account_number' })
  accountNumber: string;

  @Expose({ name: 'account_name' })
  accountName: string;

  @Expose({ name: 'tax_percentage' })
  taxPercentage: number;

  @Expose({ name: 'status' })
  status: PayrollStatus;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  static fromEntity(payroll: Payroll): PayrollResourceDto {
    const resource = new PayrollResourceDto();
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
