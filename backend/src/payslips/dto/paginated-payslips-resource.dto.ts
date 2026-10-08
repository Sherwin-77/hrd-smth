import { Expose, Type } from 'class-transformer';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { PayslipResourceDto } from './payslip-resource.dto.js';

export class PaginatedPayslipsResponseDto {
  @Expose({ name: 'data' })
  @Type(() => PayslipResourceDto)
  data: PayslipResourceDto[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
