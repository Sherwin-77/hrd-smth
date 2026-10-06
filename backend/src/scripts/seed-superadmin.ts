/**
 * Seed the starter superadmin employee.
 *
 * Usage:
 *   npm run seed               # idempotent, safe to re-run
 *   npm run seed:superadmin    # alias
 *
 * Reads `SEED_SUPERADMIN_*` overrides from the environment (see .env.example).
 * Exits 0 when the account already exists or was just created, 1 on failure.
 */
import 'dotenv/config';
import {
  resolveSuperadminSeedOptions,
  seedSuperadminWithDataSource,
} from '#database/seeds/superadmin.seed.js';
import { AppDataSource } from '#data-source.js';

async function main(): Promise<void> {
  const options = resolveSuperadminSeedOptions();

  const dataSource = AppDataSource;

  await dataSource.initialize();
  try {
    const { employee, created } = await seedSuperadminWithDataSource(
      dataSource,
      options,
    );
    if (created) {
      console.log(`Seeded superadmin ${employee.email} (${employee.id})`);
    } else {
      console.log(
        `Superadmin ${employee.email} already exists (${employee.id}), skipping`,
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

await main().catch((error) => {
  console.error('Failed to seed superadmin:', error);
  process.exitCode = 1;
});
