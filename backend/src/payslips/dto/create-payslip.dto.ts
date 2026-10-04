import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePayslipDto {
  @Expose({ name: 'payroll_id' })
  @IsUUID()
  payrollId: string;

  @Expose({ name: 'basic_salary' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @Expose({ name: 'overtime' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtime?: number;

  @Expose({ name: 'tax' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax?: number;

  @Expose({ name: 'bonus' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bonus?: number;

  @Expose({ name: 'deduction' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deduction?: number;

  @Expose({ name: 'date' })
  @IsDateString()
  date: string;
}
