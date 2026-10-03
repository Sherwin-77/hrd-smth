import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeSessionsTable1791019518938 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "employee_sessions" (
                "id" UUID NOT NULL DEFAULT UUIDV7(),
                "employee_id" UUID NOT NULL,
                "token_hash" VARCHAR(255) NOT NULL,
                "user_agent" VARCHAR(500),
                "ip_address" VARCHAR(64),
                "created_at" TIMESTAMPTZ(6),
                "last_used_at" TIMESTAMPTZ(6),
                "expires_at" TIMESTAMPTZ NOT NULL,
                "revoked_at" TIMESTAMPTZ,

                CONSTRAINT "employee_sessions_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "employee_sessions_token_hash_unique" UNIQUE ("token_hash"),
                CONSTRAINT "employee_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES employees("id") ON DELETE CASCADE
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "employee_sessions_employee_id_idx" ON "employee_sessions" ("employee_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "employee_sessions"
        `);
  }
}
