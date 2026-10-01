import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export const EmployeeSex = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type EmployeeSex = (typeof EmployeeSex)[keyof typeof EmployeeSex];

@Entity('employees')
export class Employee {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  address: string;

  @Column({ type: 'enum', enum: EmployeeSex })
  sex: EmployeeSex;

  @Column({ name: 'birth_date' })
  birthDate: Date;

  @Column({ name: 'join_at' })
  joinAt: Date;

  @Column({ name: 'leave_at', nullable: true })
  leaveAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
