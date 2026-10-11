import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Employee } from '#employees/entities/employee.entity.js';
import { Role } from './role.entity.js';

@Entity('employee_roles')
export class EmployeeRole {
  @PrimaryColumn('uuid', { name: 'employee_id' })
  employeeId: string;

  @PrimaryColumn('uuid', { name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
