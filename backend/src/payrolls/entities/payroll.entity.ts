import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { PayrollComponent } from "./payroll-component.entity.js";
import { Employee } from "../../employees/entities/employee.entity.js";

export const PayrollStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus];

@Entity("payrolls")
export class Payroll {
    @PrimaryColumn('uuid')
    id: string;

    @Column({name: 'employee_id'})
    employeeId: string;

    @Column({name: 'account_number'})
    accountNumber: string;

    @Column({name: 'account_name'})
    accountName: string;

    @Column({
        name: 'tax_percentage',
        type: 'decimal',
        'precision': 5,
        'scale': 4,
    })
    taxPercentage: number = 0.0000;

    @Column({
        name: 'status',
        type: 'enum',
        enum: PayrollStatus,
    })
    status: PayrollStatus = PayrollStatus.ACTIVE;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    

    @ManyToOne(() => Employee, (employee) => employee.payrolls)
    @JoinColumn({name: 'employee_id'})
    employee: Employee;

    @OneToMany(() => PayrollComponent, (payrollComponent) => payrollComponent.payroll)
    payrollComponents: PayrollComponent[]
}
