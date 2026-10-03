import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayslipsTable1790860425100 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE payslips (
                "id" UUID NOT NULL DEFAULT UUIDV7(),
                "payroll_id" UUID NOT NULL,
                "basic_salary" DECIMAL(16, 2) NOT NULL,
                "overtime" DECIMAL(16, 2) NOT NULL,
                "tax" DECIMAL(16, 2) NOT NULL,
                "bonus" DECIMAL(16, 2) NOT NULL,
                "deduction" DECIMAL(16, 2) NOT NULL,
                "date" DATE NOT NULL,
                "status" VARCHAR(255) NOT NULL,
                "created_at" TIMESTAMPTZ(6),
                "updated_at" TIMESTAMPTZ(6),

                CONSTRAINT "payslips_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "payslips_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES payrolls("id") ON DELETE CASCADE
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE payslips;
        `);
    }

}
