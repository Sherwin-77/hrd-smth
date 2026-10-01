import { EmployeeSex } from '../entities/employee.entity.js';
import type { Employee } from '../entities/employee.entity.js';

export class EmployeeIndexResourceDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  sex: EmployeeSex;
  birthDate: Date;
  joinAt: Date;
  leaveAt: Date | null;
  createdAt: Date;
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
