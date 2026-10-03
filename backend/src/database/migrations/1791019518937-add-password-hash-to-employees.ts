import { MigrationInterface, QueryRunner } from 'typeorm';

// PasswordHasher (default scrypt parameters) hash of the fallback password
// 'secret', for rows created before the password column existed.
const FALLBACK_PASSWORD_HASH =
  '$scrypt$ln=17,r=8,p=1$Qpg9bY+B27eJauhCqJ7sAQ$CqIt30Get2NNjVQvUd0ESFWeGTP262cFeGAua/f06H8';

export class AddPasswordHashToEmployees1791019518937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "employees"
            ADD COLUMN "password_hash" VARCHAR(255)
        `);
    await queryRunner.query(
      `UPDATE "employees" SET "password_hash" = $1 WHERE "password_hash" IS NULL`,
      [FALLBACK_PASSWORD_HASH],
    );
    await queryRunner.query(`
            ALTER TABLE "employees"
            ALTER COLUMN "password_hash" SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "employees"
            DROP COLUMN "password_hash"
        `);
  }
}
