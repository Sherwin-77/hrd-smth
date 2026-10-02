import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation, UpdateDateColumn } from "typeorm";
import { Payroll } from "#payrolls/entities/payroll.entity.js";

export const PayrollComponentStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type PayrollComponentStatus = (typeof PayrollComponentStatus)[keyof typeof PayrollComponentStatus];

@Entity("payroll_components")
export class PayrollComponent {
    @PrimaryColumn('uuid')
    id: string;

    @Column({name: 'payroll_id', type: 'uuid'})
    payrollId: string;

    @Column({
        name: 'basic_salary',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    basicSalary: number = 0.00;

    @Column({
        name: 'overtime',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    overtime: number = 0.00;

    @Column({
        name: 'tax',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    tax : number = 0.00;

    @Column({
        name: 'bonus',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    bonus: number = 0.00;

    @Column({
        name: 'deduction',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    deduction: number = 0.00;

    @Column({name: 'date', type: 'date'})
    date: Date;

    @Column({
        name: 'status',
        type: 'enum',
        enum: PayrollComponentStatus,
        default: PayrollComponentStatus.PENDING
    })
    status: PayrollComponentStatus;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
    
    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;   
     

    @ManyToOne(() => Payroll, (payroll) => payroll.payrollComponents)
    @JoinColumn({name: 'payroll_id'})
    payroll: Relation<Payroll>;
}