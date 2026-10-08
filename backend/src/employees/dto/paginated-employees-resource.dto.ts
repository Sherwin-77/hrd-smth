import { Expose, Type } from 'class-transformer';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { EmployeeIndexResourceDto } from './employee-index-resource.dto.js';
import { EmployeeDetailResourceDto } from './employee-detail-resource.dto.js';

export class PaginatedEmployeesResponseDto {
  @Expose({ name: 'data' })
  @Type(() => EmployeeIndexResourceDto)
  data: EmployeeIndexResourceDto[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}

export class PaginatedEmployeesWithPayrollResponseDto {
  @Expose({ name: 'data' })
  @Type(() => EmployeeDetailResourceDto)
  data: EmployeeDetailResourceDto[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
