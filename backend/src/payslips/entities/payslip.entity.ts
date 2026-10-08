import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation, UpdateDateColumn } from "typeorm";
import { Payroll } from "#payrolls/entities/payroll.entity.js";
import { Employee } from "#employees/entities/employee.entity.js";

export const PayslipStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type PayslipStatus = (typeof PayslipStatus)[keyof typeof PayslipStatus];

export interface PayslipAmounts {
    basicSalary: number;
    overtime: number;
    tax: number;
    bonus: number;
    deduction: number;
}

/**
 * Net pay: basic + overtime - tax + bonus - deduction.
 * Rounded to 2 decimals to match `DECIMAL(16, 2)`; may be negative.
 */
export function calculatePayslipTotal(amounts: PayslipAmounts): number {
    const total =
        amounts.basicSalary +
        amounts.overtime -
        amounts.tax +
        amounts.bonus -
        amounts.deduction;
    return Math.round((total + Number.EPSILON) * 100) / 100;
}

@Entity("payslips")
export class Payslip {
    @PrimaryColumn('uuid')
    id: string;

    @Column({name: 'employee_id', type: 'uuid'})
    employeeId: string

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

    @Column({
        name: 'total',
        type: 'decimal',
        'precision': 16,
        'scale': 2,
    })
    total: number = 0.00;

    @Column({name: 'date', type: 'date'})
    date: Date;

    @Column({
        name: 'status',
        type: 'enum',
        enum: PayslipStatus,
        default: PayslipStatus.PENDING
    })
    status: PayslipStatus;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
    
    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;   

    @DeleteDateColumn({name: 'deleted_at'})
    deletedAt: Date | null;


    @ManyToOne(() => Employee, (employee) => employee.payslips)
    @JoinColumn({name: 'employee_id'})
    employee: Relation<Employee>

    @ManyToOne(() => Payroll, (payroll) => payroll.payslips)
    @JoinColumn({name: 'payroll_id'})
    payroll: Relation<Payroll>;
}