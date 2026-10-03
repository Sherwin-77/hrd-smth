import { vi } from 'vitest';
import { TypeOrmSessionStore } from './typeorm-session.store.js';

describe('TypeOrmSessionStore', () => {
  function repositoryWith(overrides: Record<string, unknown> = {}) {
    return {
      findOne: vi.fn(),
      create: vi.fn((value: unknown) => value),
      save: vi.fn(async (value: unknown) => value),
      createQueryBuilder: vi.fn(),
      delete: vi.fn(),
      find: vi.fn(),
      ...overrides,
    };
  }

  function storeWith(repository: ReturnType<typeof repositoryWith>) {
    const storage = { registerSource: vi.fn() };
    const store = new TypeOrmSessionStore(
      repository as never,
      storage as never,
    );
    return { store, storage };
  }

  const liveRow = {
    tokenHash: 'session-id',
    employeeId: 'employee-id',
    createdAt: new Date('2024-01-01'),
    lastUsedAt: new Date('2024-02-01'),
    expiresAt: new Date('2024-03-01'),
    revokedAt: null,
    userAgent: 'agent',
    ipAddress: '127.0.0.1',
  };

  it('registers itself as the sessions source', () => {
    const repository = repositoryWith();
    const { storage, store } = storeWith(repository);
    expect(storage.registerSource).toHaveBeenCalledWith({ sessions: store });
  });

  it('getSession maps a live row and hides revoked ones', async () => {
    const repository = repositoryWith();
    const { store } = storeWith(repository);
    repository.findOne.mockResolvedValue(liveRow);
    const record = await store.getSession('session-id');
    expect(record).toMatchObject({ id: 'session-id', userId: 'employee-id' });
    expect(record?.metadata).toMatchObject({
      userAgent: 'agent',
      ipAddress: '127.0.0.1',
    });

    repository.findOne.mockResolvedValue(null);
    await expect(store.getSession('missing')).resolves.toBeUndefined();

    repository.findOne.mockResolvedValue({ ...liveRow, revokedAt: new Date() });
    await expect(store.getSession('session-id')).resolves.toBeUndefined();
  });

  it('createSession persists metadata into columns', async () => {
    const repository = repositoryWith();
    const { store } = storeWith(repository);
    await store.createSession({
      id: 'new-id',
      userId: 'employee-id',
      createdAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-03-01'),
      lastActiveAt: new Date('2024-02-01'),
      metadata: { userAgent: 'agent', ipAddress: '1.2.3.4' },
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'new-id',
        employeeId: 'employee-id',
        userAgent: 'agent',
        ipAddress: '1.2.3.4',
        revokedAt: null,
      }),
    );
    expect(repository.save).toHaveBeenCalled();
  });

  it('touchSession only moves lastUsedAt forward for live rows', async () => {
    const repository = repositoryWith();
    const execute = vi.fn().mockResolvedValue({ affected: 1 });
    const andWhere2 = vi.fn().mockReturnValue({ execute });
    const andWhere1 = vi.fn().mockReturnValue({ andWhere: andWhere2 });
    const where = vi.fn().mockReturnValue({ andWhere: andWhere1 });
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    repository.createQueryBuilder.mockReturnValue({ update });
    const { store } = storeWith(repository);

    const at = new Date('2024-02-02');
    await store.touchSession('session-id', at);
    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({ lastUsedAt: at });
    expect(where).toHaveBeenCalledWith('token_hash = :id', {
      id: 'session-id',
    });
  });

  it('deleteSession reports whether a row was deleted', async () => {
    const repository = repositoryWith();
    const { store } = storeWith(repository);
    repository.delete.mockResolvedValue({ affected: 1 });
    await expect(store.deleteSession('session-id')).resolves.toBe(true);
    repository.delete.mockResolvedValue({ affected: 0 });
    await expect(store.deleteSession('missing')).resolves.toBe(false);
  });

  it('listUserSessions maps rows to records', async () => {
    const repository = repositoryWith();
    const { store } = storeWith(repository);
    repository.find.mockResolvedValue([liveRow]);
    const records = await store.listUserSessions('employee-id');
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: 'session-id',
      userId: 'employee-id',
    });
  });

  it('deleteUserSessions removes every session of the user', async () => {
    const repository = repositoryWith();
    const { store } = storeWith(repository);
    repository.delete.mockResolvedValue({ affected: 2 });
    await store.deleteUserSessions('employee-id');
    expect(repository.delete).toHaveBeenCalledWith({
      employeeId: 'employee-id',
    });
  });
});
