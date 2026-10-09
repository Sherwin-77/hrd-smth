import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeesTable1790858867584 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "employees" (
                "id" UUID NOT NULL DEFAULT UUIDV7(),
                "name" VARCHAR(255) NOT NULL,
                "email" VARCHAR(255) NOT NULL UNIQUE,
                "password_hash" VARCHAR(255) NOT NULL,
                "phone_number" VARCHAR(255) NOT NULL,
                "address" VARCHAR(255) NOT NULL,
                "sex" VARCHAR(255) NOT NULL,
                "birth_date" DATE NOT NULL,
                "join_at" TIMESTAMPTZ NOT NULL,
                "leave_at" TIMESTAMPTZ,
                "created_at" TIMESTAMPTZ(6),
                "updated_at" TIMESTAMPTZ(6),
                "deleted_at" TIMESTAMPTZ(6),

                CONSTRAINT "employees_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "employees_email_unique" UNIQUE ("email")
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "employees"
        `);
  }
}
