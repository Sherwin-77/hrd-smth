import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayrollsTable1790859904824 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE payrolls (
                "id" UUID NOT NULL DEFAULT UUIDV7(),
                "employee_id" UUID NOT NULL,
                "account_number" VARCHAR(255) NOT NULL,
                "account_name" VARCHAR(255) NOT NULL,
                "tax_percentage" DECIMAL(5, 4) NOT NULL,
                "status" VARCHAR(255) NOT NULL,
                "created_at" TIMESTAMPTZ(6),
                "updated_at" TIMESTAMPTZ(6),
                "deleted_at" TIMESTAMPTZ(6),

                CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES employees("id")
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE payrolls;
        `);
    }

}
