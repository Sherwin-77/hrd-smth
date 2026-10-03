import { PasswordHasher } from '@nestjs/authentication';
import { vi } from 'vitest';
import {
  DEFAULT_SUPERADMIN_SEED,
  resolveSuperadminSeedOptions,
  seedSuperadmin,
} from './superadmin.seed.js';
import { EmployeeSex } from '#employees/entities/employee.entity.js';

describe('seedSuperadmin', () => {
  const passwords = new PasswordHasher({ logN: 10 });

  function mockRepository(existing: unknown = null) {
    return {
      findOneBy: vi.fn().mockResolvedValue(existing),
      create: vi.fn().mockImplementation((value: object) => ({ ...value })),
      save: vi.fn().mockImplementation(async (value: unknown) => value),
    };
  }

  it('creates the superadmin when none exists', async () => {
    const repository = mockRepository(null);

    const { employee, created } = await seedSuperadmin(
      repository,
      passwords,
      DEFAULT_SUPERADMIN_SEED,
    );

    expect(created).toBe(true);
    expect(repository.findOneBy).toHaveBeenCalledWith({
      email: DEFAULT_SUPERADMIN_SEED.email,
    });
    expect(repository.save).toHaveBeenCalledOnce();
    const createdInput = repository.create.mock.calls[0][0] as {
      passwordHash: string;
    };
    expect(createdInput.passwordHash).toBeTypeOf('string');
    await expect(
      passwords.verify(
        DEFAULT_SUPERADMIN_SEED.password,
        createdInput.passwordHash,
      ),
    ).resolves.toBe(true);
    expect(employee).toBeDefined();
  });

  it('skips seeding when the email already exists', async () => {
    const existing = { id: 'existing-id', email: 'superadmin@example.com' };
    const repository = mockRepository(existing);

    const result = await seedSuperadmin(
      repository,
      passwords,
      DEFAULT_SUPERADMIN_SEED,
    );

    expect(result.created).toBe(false);
    expect(result.employee).toBe(existing);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('normalizes email casing and rejects short passwords', async () => {
    const repository = mockRepository(null);

    await seedSuperadmin(repository, passwords, {
      ...DEFAULT_SUPERADMIN_SEED,
      email: '  SUPERADMIN@Example.COM ',
    });
    expect(repository.findOneBy).toHaveBeenCalledWith({
      email: 'superadmin@example.com',
    });

    await expect(
      seedSuperadmin(repository, passwords, {
        ...DEFAULT_SUPERADMIN_SEED,
        password: 'short',
      }),
    ).rejects.toThrow(/at least 8/);
  });

  it('resolves overrides from env with defaults', () => {
    const options = resolveSuperadminSeedOptions({
      SEED_SUPERADMIN_EMAIL: 'boss@example.com',
      SEED_SUPERADMIN_SEX: EmployeeSex.FEMALE,
    } as NodeJS.ProcessEnv);
    expect(options.email).toBe('boss@example.com');
    expect(options.sex).toBe(EmployeeSex.FEMALE);
    expect(options.password).toBe(DEFAULT_SUPERADMIN_SEED.password);
  });
});
