import { Expose } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

/**
 * Optional body for the `sign` transition. When `signed_date` is omitted
 * it defaults to today (server date).
 */
export class SignContractDto {
  @Expose({ name: 'signed_date' })
  @IsOptional()
  @IsDateString()
  signedDate?: string;
}
