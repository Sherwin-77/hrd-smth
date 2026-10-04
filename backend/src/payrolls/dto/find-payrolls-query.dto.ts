import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { PayrollStatus } from '../entities/payroll.entity.js';

export const PAYROLL_SORTABLE_FIELDS = [
  'accountNumber',
  'accountName',
  'createdAt',
  'updatedAt',
] as const;
export type PayrollSortField = (typeof PAYROLL_SORTABLE_FIELDS)[number];

export class FindPayrollsQueryDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @Expose({ name: 'employee_id' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @IsIn(PAYROLL_SORTABLE_FIELDS as unknown as string[])
  sortBy?: PayrollSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
