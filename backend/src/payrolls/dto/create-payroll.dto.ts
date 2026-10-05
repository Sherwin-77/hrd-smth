import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreatePayrollDto {
  @Expose({ name: 'employee_id' })
  @IsUUID()
  employeeId: string;

  @Expose({ name: 'account_number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountNumber: string;

  @Expose({ name: 'account_name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName: string;

  @Expose({ name: 'tax_percentage' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxPercentage: number;
}
