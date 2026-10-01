import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const EMPLOYEE_SORTABLE_FIELDS = [
  'name',
  'email',
  'joinAt',
  'createdAt',
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

  @IsOptional()
  @IsIn(EMPLOYEE_SORTABLE_FIELDS as unknown as string[])
  sortBy?: EmployeeSortField = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
