import { Expose } from 'class-transformer';
import { calculatePayslipTotal } from '#payslips/entities/payslip.entity.js';
import { SimulatePayslipDto } from './simulate-payslip.dto.js';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class PayslipSimulationResourceDto {
  @Expose({ name: 'basic_salary' })
  basicSalary: number;

  @Expose({ name: 'overtime' })
  overtime: number;

  @Expose({ name: 'tax' })
  tax: number;

  @Expose({ name: 'bonus' })
  bonus: number;

  @Expose({ name: 'deduction' })
  deduction: number;

  @Expose({ name: 'total' })
  total: number;

  static fromAmounts(amounts: SimulatePayslipDto): PayslipSimulationResourceDto {
    const resource = new PayslipSimulationResourceDto();
    resource.basicSalary = amounts.basicSalary;
    resource.overtime = amounts.overtime ?? 0;
    resource.tax = amounts.tax ?? 0;
    resource.bonus = amounts.bonus ?? 0;
    resource.deduction = amounts.deduction ?? 0;
    resource.total = calculatePayslipTotal({
      basicSalary: resource.basicSalary,
      overtime: resource.overtime,
      tax: resource.tax,
      bonus: resource.bonus,
      deduction: resource.deduction,
    });
    return resource;
  }
}
