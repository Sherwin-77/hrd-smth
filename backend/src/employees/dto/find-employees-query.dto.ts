import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Wire values are snake_case; services map them to entity columns. */
export const EMPLOYEE_SORTABLE_FIELDS = [
  'name',
  'email',
  'join_at',
  'created_at',
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORTABLE_FIELDS)[number];

export class FindEmployeesQueryDto {
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

  @Expose({ name: 'sort_by' })
  @IsOptional()
  @IsIn(EMPLOYEE_SORTABLE_FIELDS as unknown as string[])
  sortBy?: EmployeeSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
