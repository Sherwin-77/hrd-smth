import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PayslipStatus } from '../entities/payslip.entity.js';

export const PAYSLIP_SORTABLE_FIELDS = [
  'date',
  'basicSalary',
  'createdAt',
  'updatedAt',
] as const;
export type PayslipSortField = (typeof PAYSLIP_SORTABLE_FIELDS)[number];

export class FindPayslipsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Expose({ name: 'employee_id' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @Expose({ name: 'payroll_id' })
  @IsOptional()
  @IsUUID()
  payrollId?: string;

  @IsOptional()
  @IsEnum(PayslipStatus)
  status?: PayslipStatus;

  @IsOptional()
  @IsIn(PAYSLIP_SORTABLE_FIELDS as unknown as string[])
  sortBy?: PayslipSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
