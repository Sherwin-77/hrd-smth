import { Expose } from 'class-transformer';
import { EmployeeSex } from '../entities/employee.entity.js';
import type { Employee } from '../entities/employee.entity.js';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class EmployeeIndexResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'email' })
  email: string;

  @Expose({ name: 'phone_number' })
  phoneNumber: string;

  @Expose({ name: 'address' })
  address: string;

  @Expose({ name: 'sex' })
  sex: EmployeeSex;

  @Expose({ name: 'birth_date' })
  birthDate: Date;

  @Expose({ name: 'join_at' })
  joinAt: Date;

  @Expose({ name: 'leave_at' })
  leaveAt: Date | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  static fromEntity(employee: Employee): EmployeeIndexResourceDto {
    const resource = new EmployeeIndexResourceDto();
    resource.id = employee.id;
    resource.name = employee.name;
    resource.email = employee.email;
    resource.phoneNumber = employee.phoneNumber;
    resource.address = employee.address;
    resource.sex = employee.sex;
    resource.birthDate = employee.birthDate;
    resource.joinAt = employee.joinAt;
    resource.leaveAt = employee.leaveAt;
    resource.createdAt = employee.createdAt;
    resource.updatedAt = employee.updatedAt;
    return resource;
  }
}
