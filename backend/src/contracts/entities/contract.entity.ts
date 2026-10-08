import { Column, Entity, PrimaryColumn } from "typeorm";

export const ContractType = {
    PERMANENT: 'permanent',
    FIXED_TIME: 'fixed_time',
}

export type ContractType = (typeof ContractType)[keyof typeof ContractType]

export const ContractStatus = {
    PENDING: 'pending',
    SIGNED: 'signed',
    DECLINED: 'declined',
    VOIDED: 'voided',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus]

@Entity("contracts")
export class Contract {
    @PrimaryColumn('uuid')
    id: string;

    @Column({name: 'employee_id', type: 'uuid'})
    employeeId: string

    @Column({
        name: 'type',
        type: 'enum',
        enum: ContractType,
    })
    type: ContractType;

    @Column({name: 'start_date', type: 'date'})
    startDate: Date

    @Column({name: 'end_date', type: 'date', nullable: true})
    endDate: Date

    @Column({name: 'signed_date', type: 'date', nullable: true})
    signedDate: Date

    @Column({name: 'title'})
    title: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: ContractStatus,
    })
    status: string;
}
