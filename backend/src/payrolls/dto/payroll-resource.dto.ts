import { Expose, Type } from 'class-transformer';
import { Payroll, PayrollStatus } from '#payrolls/entities/payroll.entity.js';
import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { getPayrollActions } from '#payrolls/payroll.workflow.js';

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

  @Expose({ name: 'available_actions' })
  @Type(() => ActionLinkDto)
  availableActions: ActionLinkDto[];

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
    resource.availableActions = getPayrollActions(payroll.status, payroll.id);
    return resource;
  }
}
