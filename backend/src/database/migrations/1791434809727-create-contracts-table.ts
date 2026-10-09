import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractsTable1791434809727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "contracts" (
                "id" UUID NOT NULL DEFAULT UUIDV7(),
                "employee_id" UUID NOT NULL,
                "type" VARCHAR(255) NOT NULL,
                "start_date" DATE NOT NULL,
                "end_date" DATE,
                "signed_date" DATE,
                "title" VARCHAR(255) NOT NULL,
                "status" VARCHAR(255) NOT NULL,
                "created_at" TIMESTAMPTZ(6),
                "updated_at" TIMESTAMPTZ(6),
                "deleted_at" TIMESTAMPTZ(6),

                CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES employees("id")
            );

        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "contracts";
        `);
  }
}
