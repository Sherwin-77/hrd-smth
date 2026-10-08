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
import { ContractStatus, ContractType } from '../entities/contract.entity.js';

/** Wire values are snake_case; services map them to entity columns. */
export const CONTRACT_SORTABLE_FIELDS = [
  'start_date',
  'end_date',
  'signed_date',
  'created_at',
  'updated_at',
] as const;
export type ContractSortField = (typeof CONTRACT_SORTABLE_FIELDS)[number];

export class FindContractsQueryDto {
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

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @Expose({ name: 'sort_by' })
  @IsOptional()
  @IsIn(CONTRACT_SORTABLE_FIELDS as unknown as string[])
  sortBy?: ContractSortField = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
