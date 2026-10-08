import { Expose, Type } from 'class-transformer';
import { EmployeeIndexResourceDto } from '#employees/dto/employee-index-resource.dto.js';
import type { Employee } from '#employees/entities/employee.entity.js';

/**
 * `POST /auth/login` response. Wire format is snake_case (via `@Expose`
 * + global `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class LoginResponseDto {
  @Expose({ name: 'employee' })
  @Type(() => EmployeeIndexResourceDto)
  employee: EmployeeIndexResourceDto;

  @Expose({ name: 'token' })
  token: string;

  @Expose({ name: 'expires_at' })
  expiresAt: Date;

  @Expose({ name: 'session_id' })
  sessionId: string;

  static fromLogin(
    employee: Omit<Employee, 'passwordHash'>,
    session: { token: string; expiresAt: Date; sessionId: string },
  ): LoginResponseDto {
    const resource = new LoginResponseDto();
    resource.employee = EmployeeIndexResourceDto.fromEntity(
      employee as Employee,
    );
    resource.token = session.token;
    resource.expiresAt = session.expiresAt;
    resource.sessionId = session.sessionId;
    return resource;
  }
}
