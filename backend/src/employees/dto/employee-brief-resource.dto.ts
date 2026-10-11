import { Expose } from 'class-transformer';
import type { Employee } from '../entities/employee.entity.js';

/**
 * Minimal employee info embedded in contract, payroll, and payslip
 * resources so list views can show ownership without an extra fetch.
 * Wire format is snake_case; TypeScript names stay camelCase.
 */
export class EmployeeBriefResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'email' })
  email: string;

  static fromEntity(employee: Employee): EmployeeBriefResourceDto {
    const resource = new EmployeeBriefResourceDto();
    resource.id = employee.id;
    resource.name = employee.name;
    resource.email = employee.email;
    return resource;
  }
}
