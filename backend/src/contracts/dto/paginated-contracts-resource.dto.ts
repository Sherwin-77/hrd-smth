import { Expose, Type } from 'class-transformer';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { ContractResourceDto } from './contract-resource.dto.js';

export class PaginatedContractsResponseDto {
  @Expose({ name: 'data' })
  @Type(() => ContractResourceDto)
  data: ContractResourceDto[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
