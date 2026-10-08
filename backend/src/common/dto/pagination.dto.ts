import { Expose, Type } from 'class-transformer';

/**
 * Shared paginated `meta` envelope. Wire format is snake_case (via
 * `@Expose` + global `ClassSerializerInterceptor`); TypeScript names
 * stay camelCase.
 */
export class PaginationMetaDto {
  @Expose({ name: 'total' })
  total: number;

  @Expose({ name: 'page' })
  page: number;

  @Expose({ name: 'limit' })
  limit: number;

  @Expose({ name: 'total_pages' })
  totalPages: number;

  static fromTotal(
    total: number,
    page: number,
    limit: number,
  ): PaginationMetaDto {
    const meta = new PaginationMetaDto();
    meta.total = total;
    meta.page = page;
    meta.limit = limit;
    meta.totalPages = Math.ceil(total / limit);
    return meta;
  }
}

/**
 * Base class for paginated list responses so the global serializer can
 * reach `data` items and `meta`. Concrete responses supply the `@Type`
 * for `data`.
 */
export class PaginatedResponseDto {
  @Expose({ name: 'data' })
  data: unknown[];

  @Expose({ name: 'meta' })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
