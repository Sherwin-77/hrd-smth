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

/** Wire values are snake_case; services map them to entity columns. */
export const PAYROLL_SORTABLE_FIELDS = [
  'account_number',
  'account_name',
  'created_at',
  'updated_at',
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

  @Expose({ name: 'sort_by' })
  @IsOptional()
  @IsIn(PAYROLL_SORTABLE_FIELDS as unknown as string[])
  sortBy?: PayrollSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
