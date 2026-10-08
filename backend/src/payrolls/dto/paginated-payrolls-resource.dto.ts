import { Expose, Type } from 'class-transformer';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { PayrollResourceDto } from './payroll-resource.dto.js';

export class PaginatedPayrollsResponseDto {
  @Expose({ name: 'data' })
  @Type(() => PayrollResourceDto)
  data: PayrollResourceDto[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
