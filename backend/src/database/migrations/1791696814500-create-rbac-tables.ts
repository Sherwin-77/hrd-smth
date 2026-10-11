import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacTables1791696814500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "roles" (
            "id" UUID NOT NULL DEFAULT UUIDV7(),
            "name" VARCHAR(255) NOT NULL UNIQUE,
            "is_system" BOOLEAN NOT NULL DEFAULT false,
            "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

            CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "roles_name_unique" UNIQUE ("name")
        );
    `);
    await queryRunner.query(`
        CREATE TABLE "permissions" (
            "id" UUID NOT NULL DEFAULT UUIDV7(),
            "name" VARCHAR(255) NOT NULL UNIQUE,
            "group" VARCHAR(255) NOT NULL,
            "action" VARCHAR(255) NOT NULL,
            "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

            CONSTRAINT "permissions_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "permissions_name_unique" UNIQUE ("name")
        );
    `);
    await queryRunner.query(`
        CREATE TABLE "role_permissions" (
            "role_id" UUID NOT NULL,
            "permission_id" UUID NOT NULL,

            CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id"),
            CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE,
            CONSTRAINT "role_permissions_permission_fk" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
        );
    `);
    await queryRunner.query(`
        CREATE TABLE "employee_roles" (
            "employee_id" UUID NOT NULL,
            "role_id" UUID NOT NULL,

            CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("employee_id", "role_id"),
            CONSTRAINT "employee_roles_employee_fk" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE,
            CONSTRAINT "employee_roles_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "employee_roles"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
