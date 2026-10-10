import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Calculation-only input for `POST /payslips/simulate`.
 * Unlike `CreatePayslipDto` it carries no `payroll_id`/`date`
 * because simulation persists nothing.
 */
export class SimulatePayslipDto {
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
}
