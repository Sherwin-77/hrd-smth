import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '#employees/entities/employee.entity.js';

export const ContractType = {
  PERMANENT: 'permanent',
  FIXED_TIME: 'fixed_time',
} as const;

export type ContractType = (typeof ContractType)[keyof typeof ContractType];

export const ContractStatus = {
  PENDING: 'pending',
  SIGNED: 'signed',
  DECLINED: 'declined',
  VOIDED: 'voided',
} as const;

export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];

@Entity('contracts')
export class Contract {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ContractType,
  })
  type: ContractType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'signed_date', type: 'date', nullable: true })
  signedDate: Date | null;

  @Column({ name: 'title' })
  title: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.PENDING,
  })
  status: ContractStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => Employee, (employee) => employee.contracts)
  @JoinColumn({ name: 'employee_id' })
  employee: Relation<Employee>;
}
