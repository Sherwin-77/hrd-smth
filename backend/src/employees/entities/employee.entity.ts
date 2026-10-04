import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Payroll } from '#payrolls/entities/payroll.entity.js';

export const EmployeeSex = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type EmployeeSex = (typeof EmployeeSex)[keyof typeof EmployeeSex];
@Entity('employees')
export class Employee {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({
    name: 'password_hash',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ name: 'address' })
  address: string;

  @Column({ name: 'sex', type: 'enum', enum: EmployeeSex })
  sex: EmployeeSex;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @Column({ name: 'join_at', type: 'timestamp with time zone' })
  joinAt: Date;

  @Column({ name: 'leave_at', type: 'date' })
  leaveAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => Payroll, (payroll) => payroll.employee, {
    cascade: ['soft-remove', 'recover'],
  })
  payrolls: Relation<Payroll>[];

  activePayroll: Payroll | null;
}
