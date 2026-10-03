import { AuthenticationError } from '@nestjs/authentication';
import { vi } from 'vitest';
import { BearerSessionProvider } from './bearer-session.provider.js';

describe('BearerSessionProvider', () => {
  const employee = { id: 'employee-id' };
  const session = { id: 'session-id', userId: 'employee-id' };

  function providerWith(opts: {
    session?: unknown;
    employee?: unknown;
  }) {
    const employees = {
      findOneBy: vi
        .fn()
        .mockResolvedValue(opts.employee !== undefined ? opts.employee : employee),
    };
    const sessions = {
      validate: vi
        .fn()
        .mockResolvedValue(opts.session !== undefined ? opts.session : session),
      discard: vi.fn().mockResolvedValue(undefined),
    };
    const registry = { registerProvider: vi.fn() };
    const provider = new BearerSessionProvider(
      employees as never,
      sessions as never,
      registry as never,
    );
    return { provider, employees, sessions, registry };
  }

  function contextWith(authorization?: string) {
    const headers = authorization ? { authorization } : {};
    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    } as never;
  }

  it('registers itself with the authentication registry', () => {
    const { registry, provider } = providerWith({});
    expect(registry.registerProvider).toHaveBeenCalledWith(provider);
  });

  it('returns null when no credentials are present', async () => {
    const { provider, sessions } = providerWith({});
    await expect(provider.authenticate(contextWith())).resolves.toBeNull();
    expect(sessions.validate).not.toHaveBeenCalled();
  });

  it('returns null for a non-Bearer scheme', async () => {
    const { provider, sessions } = providerWith({});
    await expect(
      provider.authenticate(contextWith('Basic abc')),
    ).resolves.toBeNull();
    expect(sessions.validate).not.toHaveBeenCalled();
  });

  it('throws for a malformed Bearer header', async () => {
    const { provider } = providerWith({});
    await expect(
      provider.authenticate(contextWith('Bearer')),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      provider.authenticate(contextWith('Bearer a b')),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('authenticates a valid Bearer token', async () => {
    const { provider } = providerWith({});
    const result = await provider.authenticate(
      contextWith('Bearer raw-token'),
    );
    expect(result?.user).toBe(employee);
    expect(result?.session).toBe(session);
  });

  it('throws for unknown or expired sessions', async () => {
    const { provider } = providerWith({ session: null });
    await expect(
      provider.authenticate(contextWith('Bearer bad')),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('discards the session and throws for deleted users', async () => {
    const { provider, sessions } = providerWith({ employee: null });
    await expect(
      provider.authenticate(contextWith('Bearer raw-token')),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(sessions.discard).toHaveBeenCalledWith('session-id');
  });
});
