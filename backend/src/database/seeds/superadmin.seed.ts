import { PasswordHasher } from '@nestjs/authentication';
import { v7 as uuidv7 } from 'uuid';
import type { DataSource, Repository } from 'typeorm';
import {
  Employee,
  type EmployeeSex,
} from '#employees/entities/employee.entity.js';

export interface SuperadminSeedOptions {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  address: string;
  sex: EmployeeSex;
  birthDate: string;
  joinAt: string;
}

export const DEFAULT_SUPERADMIN_SEED: SuperadminSeedOptions = {
  email: 'superadmin@example.com',
  password: 'secret123',
  name: 'Super Admin',
  phoneNumber: '08123456789',
  address: 'Jakarta HQ',
  sex: 'male' as EmployeeSex,
  birthDate: '1990-01-01',
  joinAt: '2026-01-01',
};

export function resolveSuperadminSeedOptions(
  env: NodeJS.ProcessEnv = process.env,
): SuperadminSeedOptions {
  return {
    email: env.SEED_SUPERADMIN_EMAIL?.trim() || DEFAULT_SUPERADMIN_SEED.email,
    password: env.SEED_SUPERADMIN_PASSWORD ?? DEFAULT_SUPERADMIN_SEED.password,
    name: env.SEED_SUPERADMIN_NAME?.trim() || DEFAULT_SUPERADMIN_SEED.name,
    phoneNumber:
      env.SEED_SUPERADMIN_PHONE?.trim() || DEFAULT_SUPERADMIN_SEED.phoneNumber,
    address:
      env.SEED_SUPERADMIN_ADDRESS?.trim() || DEFAULT_SUPERADMIN_SEED.address,
    sex: (env.SEED_SUPERADMIN_SEX?.trim() ||
      DEFAULT_SUPERADMIN_SEED.sex) as EmployeeSex,
    birthDate:
      env.SEED_SUPERADMIN_BIRTH_DATE?.trim() ||
      DEFAULT_SUPERADMIN_SEED.birthDate,
    joinAt:
      env.SEED_SUPERADMIN_JOIN_AT?.trim() || DEFAULT_SUPERADMIN_SEED.joinAt,
  };
}

type EmployeeRepoLike = Pick<
  Repository<Employee>,
  'findOneBy' | 'create' | 'save'
>;

export async function seedSuperadmin(
  repository: EmployeeRepoLike,
  passwords: Pick<PasswordHasher, 'hash'>,
  options: SuperadminSeedOptions,
): Promise<{ employee: Employee; created: boolean }> {
  const email = options.email.trim().normalize('NFC').toLowerCase();
  if (options.password.length < 8) {
    throw new Error('Seed password must be at least 8 characters long');
  }

  const existing = await repository.findOneBy({ email });
  if (existing) {
    return { employee: existing, created: false };
  }

  const passwordHash = await passwords.hash(options.password);
  const employee = repository.create({
    id: uuidv7(),
    name: options.name,
    email,
    phoneNumber: options.phoneNumber,
    address: options.address,
    sex: options.sex,
    birthDate: new Date(options.birthDate),
    joinAt: new Date(options.joinAt),
    leaveAt: null,
    passwordHash,
  });
  const saved = await repository.save(employee);
  return { employee: saved, created: true };
}

export async function seedSuperadminWithDataSource(
  dataSource: DataSource,
  options: SuperadminSeedOptions,
): Promise<{ employee: Employee; created: boolean }> {
  const repository = dataSource.getRepository(Employee);
  const passwords = new PasswordHasher();
  return seedSuperadmin(repository, passwords, options);
}
