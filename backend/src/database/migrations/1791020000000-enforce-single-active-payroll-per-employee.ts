import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceSingleActivePayrollPerEmployee1791020000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "payrolls_employee_active_unique"
      ON payrolls ("employee_id")
      WHERE status = 'active';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "payrolls_employee_active_unique";
    `);
  }
}
