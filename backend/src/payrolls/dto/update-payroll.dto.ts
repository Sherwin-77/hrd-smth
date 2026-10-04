import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

/**
 * Status and employee assignment are managed through dedicated flows
 * (`activate` / `deactivate`), so they are intentionally not updatable here.
 */
export class UpdatePayrollDto {
  @Expose({ name: 'account_number' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountNumber?: string;

  @Expose({ name: 'account_name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName?: string;

  @Expose({ name: 'tax_percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxPercentage?: number;
}
