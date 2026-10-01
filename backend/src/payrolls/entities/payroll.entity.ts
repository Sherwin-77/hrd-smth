import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { PayrollComponent } from "./payroll-component.entity.js";

export const PayrollStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus];

@Entity("payrolls")
export class Payroll {
    @PrimaryColumn({type: 'uuid', default: () => 'uuidv7()'})
    id: string;

    @Column({name: 'account_number'})
    accountNumber: string;

    @Column({name: 'account_name'})
    accountName: string;

    @Column({
        name: 'tax_percentage',
        type: 'decimal',
        'precision': 5,
        'scale': 4,
        'default': 0.0000
    })
    taxPercentage: number;

    @Column({
        name: 'status',
        type: 'enum',
        enum: PayrollStatus,
        default: PayrollStatus.ACTIVE
    })
    status: PayrollStatus;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;


    @OneToMany(() => PayrollComponent, (payrollComponent) => payrollComponent.payroll, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    payrollComponents: PayrollComponent[]
}
