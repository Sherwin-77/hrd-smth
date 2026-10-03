import {
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import {
  AuthenticationError,
  AuthenticationProvider,
  AuthenticationRegistry,
  SessionService,
  type AuthenticationResult,
  type SessionRecord,
} from '@nestjs/authentication';
import { EmployeesRepository } from '#employees/employees.repository.js';
import type { Employee } from '#employees/entities/employee.entity.js';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: Employee;
    session: SessionRecord;
  }
}

/**
 * Bearer-token authentication backed by Nest's `SessionService`.
 *
 * Reads `Authorization: Bearer <token>`, validates it as a server-side
 * session, and loads the employee. Missing or non-Bearer credentials
 * return `null` (no credentials for this provider); present-but-invalid
 * credentials throw, so optional routes still answer 401.
 */
@Injectable()
export class BearerSessionProvider extends AuthenticationProvider<
  Employee,
  SessionRecord
> {
  constructor(
    private readonly employees: EmployeesRepository,
    private readonly sessions: SessionService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  async authenticate(
    context: ExecutionContext,
  ): Promise<AuthenticationResult<Employee, SessionRecord> | null> {
    const header = this.header(context, 'authorization');
    if (!header) {
      return null;
    }
    const [scheme, token, ...rest] = header.trim().split(/\s+/);
    if (scheme.toLowerCase() !== 'bearer') {
      return null;
    }
    if (!token || rest.length > 0) {
      throw new AuthenticationError('Malformed authorization header', {
        challenge: this.challenge(),
      });
    }

    const session = await this.sessions.validate(token);
    if (!session) {
      throw new AuthenticationError('Invalid or expired session', {
        challenge: this.challenge(),
      });
    }

    const employee = await this.employees.findOneBy({ id: session.userId });
    if (!employee) {
      await this.sessions.discard(session.id);
      throw new AuthenticationError('Invalid or expired session', {
        challenge: this.challenge(),
      });
    }

    return { user: employee, session };
  }

  challenge(): string {
    return 'Bearer realm="api"';
  }
}
