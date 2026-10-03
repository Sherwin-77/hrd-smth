import { UnauthorizedException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasher, SessionService } from '@nestjs/authentication';
import { vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { EmployeesRepository } from '#employees/employees.repository.js';
import { Employee, EmployeeSex } from '#employees/entities/employee.entity.js';

describe('AuthService', () => {
  let service: AuthService;
  let passwords: PasswordHasher;
  let employees: {
    save: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let sessions: {
    create: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
    discard: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
    revokeAll: ReturnType<typeof vi.fn>;
  };

  const employee = {
    id: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '08123456789',
    address: 'Jakarta',
    sex: EmployeeSex.FEMALE,
    birthDate: new Date('1990-01-01'),
    joinAt: new Date('2024-01-01'),
    leaveAt: null,
    passwordHash: 'placeholder',
  } as Employee;

  function mockEmployeeQueryBuilder(result: Employee | null) {
    const qb = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(result),
    };
    employees.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  function mockSessionCreate() {
    sessions.create.mockImplementation(async (userId: string) => ({
      token: `token-for-${userId}`,
      cookie: `sid=token-for-${userId}`,
      session: {
        id: `session-id-for-${userId}`,
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(),
      },
    }));
  }

  beforeEach(async () => {
    employees = {
      save: vi.fn(),
      findOneBy: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    sessions = {
      create: vi.fn(),
      validate: vi.fn(),
      discard: vi.fn(),
      list: vi.fn(),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
    };
    passwords = new PasswordHasher({ logN: 10 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EmployeesRepository, useValue: employees },
        { provide: SessionService, useValue: sessions },
        { provide: PasswordHasher, useValue: passwords },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login returns a session for valid credentials', async () => {
    const passwordHash = await passwords.hash('supersecret1');
    mockEmployeeQueryBuilder({ ...employee, passwordHash });
    employees.save.mockImplementation(async (value: unknown) => value);
    mockSessionCreate();

    const result = await service.login('JANE@example.com ', 'supersecret1');

    expect(employees.createQueryBuilder).toHaveBeenCalled();
    expect(result.token).toBeTypeOf('string');
    expect(result.employee.email).toBe(employee.email);
    expect(result.employee).not.toHaveProperty('passwordHash');
  });

  it('login rejects unknown emails without revealing which check failed', async () => {
    mockEmployeeQueryBuilder(null);
    await expect(
      service.login('missing@example.com', 'whatever'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('login rejects employees with no password set', async () => {
    mockEmployeeQueryBuilder({
      ...employee,
      passwordHash: null as unknown as string,
    });
    await expect(
      service.login(employee.email, 'whatever'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login rejects a wrong password', async () => {
    const passwordHash = await passwords.hash('correct-password');
    mockEmployeeQueryBuilder({ ...employee, passwordHash });
    await expect(
      service.login(employee.email, 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('validateSession resolves the employee for an active session', async () => {
    const session = {
      id: 'session-id',
      userId: employee.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      lastActiveAt: new Date(),
    };
    sessions.validate.mockResolvedValue(session);
    employees.findOneBy.mockResolvedValue(employee);

    const result = await service.validateSession('raw-token');
    expect(result.employee).toBe(employee);
    expect(result.session).toBe(session);
  });

  it('validateSession rejects unknown tokens and deleted users', async () => {
    sessions.validate.mockResolvedValue(null);
    await expect(service.validateSession('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    sessions.validate.mockResolvedValue({
      id: 'session-id',
      userId: employee.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      lastActiveAt: new Date(),
    });
    employees.findOneBy.mockResolvedValue(null);
    await expect(service.validateSession('orphaned')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.discard).toHaveBeenCalledWith('session-id');
  });

  it('logout discards the current session and is idempotent', async () => {
    sessions.discard.mockResolvedValue(undefined);
    await expect(service.logout('session-id')).resolves.toBeUndefined();
    expect(sessions.discard).toHaveBeenCalledWith('session-id');
  });

  it('revokeSession revokes one owned session', async () => {
    sessions.revoke.mockResolvedValue(true);
    await expect(
      service.revokeSession(employee.id, 'session-id'),
    ).resolves.toBeUndefined();
    expect(sessions.revoke).toHaveBeenCalledWith('session-id', {
      userId: employee.id,
    });
  });

  it('revokeSession throws for sessions owned by someone else', async () => {
    sessions.revoke.mockResolvedValue(false);
    await expect(
      service.revokeSession(employee.id, 'other-session'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('changePassword verifies the current password and revokes other sessions', async () => {
    const passwordHash = await passwords.hash('old-password');
    mockEmployeeQueryBuilder({ ...employee, passwordHash });
    employees.save.mockImplementation(async (value: unknown) => value);
    sessions.revokeAll.mockResolvedValue(undefined);

    await service.changePassword(
      employee.id,
      'old-password',
      'brand-new-password',
      'current-session',
    );

    const saved = employees.save.mock.calls[0][0] as Employee;
    expect(saved.passwordHash).not.toBe(passwordHash);
    await expect(
      passwords.verify('brand-new-password', saved.passwordHash),
    ).resolves.toBe(true);
    expect(sessions.revokeAll).toHaveBeenCalledWith(employee.id, {
      except: 'current-session',
    });
  });

  it('changePassword rejects a wrong current password', async () => {
    const passwordHash = await passwords.hash('old-password');
    mockEmployeeQueryBuilder({ ...employee, passwordHash });
    await expect(
      service.changePassword(employee.id, 'wrong', 'brand-new-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(employees.save).not.toHaveBeenCalled();
  });
});
