import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PasswordHasher,
  SessionService,
  type SessionRecord,
} from '@nestjs/authentication';
import { EmployeesRepository } from '#employees/employees.repository.js';
import { Employee } from '#employees/entities/employee.entity.js';

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
  sessionId: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_SESSION = 'Invalid or expired session';

const normalizeEmail = (value: string) =>
  value.trim().normalize('NFC').toLowerCase();

function sanitize<T extends Employee>(employee: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = employee;
  return rest;
}

function sessionMetadata(
  meta: SessionMetadata,
): Record<string, unknown> | undefined {
  const metadata: Record<string, unknown> = {};
  if (meta.userAgent) {
    metadata.userAgent = meta.userAgent;
  }
  if (meta.ipAddress) {
    metadata.ipAddress = meta.ipAddress;
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly employees: EmployeesRepository,
    private readonly sessions: SessionService,
    private readonly passwords: PasswordHasher,
  ) {}

  async login(
    email: string,
    password: string,
    meta: SessionMetadata = {},
  ): Promise<CreatedSession & { employee: Omit<Employee, 'passwordHash'> }> {
    const normalized = normalizeEmail(email);
    const employee = await this.employees
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .where('employee.email = :email', { email: normalized })
      .getOne();

    if (!employee) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const ok = await this.passwords.verify(password, employee.passwordHash);
    if (!ok) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    await this.rehashIfNeeded(employee, password);

    const created = await this.createSession(employee.id, meta);
    return { employee: sanitize(employee), ...created };
  }

  async validateSession(
    rawToken: string,
  ): Promise<{ employee: Employee; session: SessionRecord }> {
    const session = await this.sessions.validate(rawToken);
    if (!session) {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    const employee = await this.employees.findOneBy({ id: session.userId });
    if (!employee) {
      await this.sessions.discard(session.id);
      throw new UnauthorizedException(INVALID_SESSION);
    }
    return { employee, session };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.discard(sessionId);
  }

  async logoutByToken(rawToken: string): Promise<void> {
    const session = await this.sessions.validate(rawToken);
    if (session) {
      await this.sessions.discard(session.id);
    }
  }

  listSessions(employeeId: string): Promise<SessionRecord[]> {
    return this.sessions.list(employeeId);
  }

  async revokeSession(employeeId: string, sessionId: string): Promise<void> {
    const revoked = await this.sessions.revoke(sessionId, {
      userId: employeeId,
    });
    if (!revoked) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }
  }

  async revokeOtherSessions(
    employeeId: string,
    exceptSessionId: string,
  ): Promise<void> {
    await this.sessions.revokeAll(employeeId, { except: exceptSessionId });
  }

  async revokeAllSessions(employeeId: string): Promise<void> {
    await this.sessions.revokeAll(employeeId);
  }

  async changePassword(
    employeeId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string,
  ): Promise<void> {
    const employee = await this.employees
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .where('employee.id = :id', { id: employeeId })
      .getOne();

    if (!employee) {
      throw new NotFoundException(`Employee #${employeeId} not found`);
    }

    const ok = await this.passwords.verify(
      currentPassword,
      employee.passwordHash,
    );
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    employee.passwordHash = await this.passwords.hash(newPassword);
    await this.employees.save(employee);

    if (currentSessionId) {
      await this.sessions.revokeAll(employeeId, { except: currentSessionId });
    } else {
      await this.sessions.revokeAll(employeeId);
    }
  }

  private async createSession(
    employeeId: string,
    meta: SessionMetadata,
  ): Promise<CreatedSession> {
    const issued = await this.sessions.create(employeeId, {
      metadata: sessionMetadata(meta),
    });
    return {
      token: issued.token,
      expiresAt: issued.session.expiresAt,
      sessionId: issued.session.id,
    };
  }

  private async rehashIfNeeded(
    employee: Employee,
    plaintext: string,
  ): Promise<void> {
    const storedHash = employee.passwordHash;
    if (!this.passwords.needsRehash(storedHash)) {
      return;
    }
    employee.passwordHash = await this.passwords.hash(plaintext);
    await this.employees.save(employee);
  }
}
