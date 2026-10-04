import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * `payrollId` and `status` are managed through dedicated flows
 * (create pins the payroll, `approve` / `reject` drive status),
 * so they are intentionally not updatable here.
 */
export class UpdatePayslipDto {
  @Expose({ name: 'basic_salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

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
  @IsOptional()
  @IsDateString()
  date?: string;
}
