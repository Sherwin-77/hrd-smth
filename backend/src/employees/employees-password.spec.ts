import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasher } from '@nestjs/authentication';
import { vi } from 'vitest';
import { EmployeesService } from './employees.service.js';
import { EmployeesRepository } from './employees.repository.js';
import { EmployeeSex } from './entities/employee.entity.js';

describe('EmployeesService passwords', () => {
  let service: EmployeesService;
  let passwords: PasswordHasher;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
  };

  const baseDto = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'supersecret1',
    phoneNumber: '08123456789',
    address: 'Jakarta',
    sex: EmployeeSex.FEMALE,
    birthDate: '1990-01-01',
    joinAt: '2024-01-01',
  };

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      save: vi.fn(),
      findOneBy: vi.fn(),
      merge: vi.fn(),
    };
    passwords = new PasswordHasher({ logN: 10 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repository },
        { provide: PasswordHasher, useValue: passwords },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('create hashes the password and strips it from the response', async () => {
    repository.findOneBy.mockResolvedValue(null);
    repository.create.mockImplementation(
      (value: unknown) => ({ ...(value as object) }) as never,
    );
    repository.save.mockImplementation(
      async (value: never) => ({ ...(value as object) }) as never,
    );

    const saved = await service.create(baseDto);

    const created = repository.create.mock.calls[0][0] as {
      passwordHash: string;
    };
    expect(created.passwordHash).toBeTypeOf('string');
    await expect(
      passwords.verify('supersecret1', created.passwordHash),
    ).resolves.toBe(true);
    expect(saved).not.toHaveProperty('passwordHash');
  });

  it('update hashes a new password', async () => {
    const existing = { id: 'employee-id', email: 'jane@example.com' };
    repository.findOneBy.mockResolvedValue(existing);
    repository.merge.mockImplementation((_target: unknown, value: unknown) => ({
      ...existing,
      ...(value as object),
    }));
    repository.save.mockImplementation(
      async (value: never) => ({ ...(value as object) }) as never,
    );

    const saved = await service.update('employee-id', {
      password: 'brand-new-password',
    });

    const merged = repository.merge.mock.calls[0][1] as {
      passwordHash: string;
    };
    expect(merged.passwordHash).toBeTypeOf('string');
    await expect(
      passwords.verify('brand-new-password', merged.passwordHash),
    ).resolves.toBe(true);
    expect(saved).not.toHaveProperty('passwordHash');
  });
});
