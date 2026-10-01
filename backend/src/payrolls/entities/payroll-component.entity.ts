import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Payroll } from "./payroll.entity.js";

export const PayrollComponentStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type PayrollComponentStatus = (typeof PayrollComponentStatus)[keyof typeof PayrollComponentStatus];

@Entity("payroll_components")
export class PayrollComponent {
    @PrimaryColumn({type: 'uuid', default: () => 'uuidv7()'})
    id: string;

    @Column({name: 'payroll_id', type: 'uuid'})
    payrollId: string;

    @Column({
        name: 'basic_salary',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
        'default': 0.0000
    })
    basicSalary: number;

    @Column({
        name: 'overtime',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
        'default': 0.0000
    })
    overtime: number;

    @Column({
        name: 'tax',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
        'default': 0.0000
    })
    tax : number;

    @Column({
        name: 'bonus',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
        'default': 0.0000
    })
    bonus: number;

    @Column({
        name: 'deduction',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
        'default': 0.0000
    })
    deduction: number;

    @Column({
        name: 'date',
        type: 'date'
    })
    date: Date;

    @Column({
        name: 'status',
        type: 'enum',
        enum: PayrollComponentStatus,
        default: PayrollComponentStatus.PENDING
    })
    status: PayrollComponentStatus;


    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;    

    @ManyToOne(() => Payroll, (payroll) => payroll.payrollComponents, {
        onDelete: "CASCADE"
    })
    @JoinColumn({name: 'payroll_id'})
    payroll: Payroll;
}