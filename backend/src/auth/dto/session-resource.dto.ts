import { Expose } from 'class-transformer';
import type { SessionRecord } from '@nestjs/authentication';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class SessionResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'last_used_at' })
  lastUsedAt: Date;

  @Expose({ name: 'expires_at' })
  expiresAt: Date;

  @Expose({ name: 'revoked_at' })
  revokedAt: Date | null;

  @Expose({ name: 'user_agent' })
  userAgent: string | null;

  @Expose({ name: 'ip_address' })
  ipAddress: string | null;

  @Expose({ name: 'is_current' })
  isCurrent: boolean;

  static fromEntity(
    session: SessionRecord,
    currentSessionId?: string,
  ): SessionResourceDto {
    const metadata = session.metadata ?? {};
    const resource = new SessionResourceDto();
    resource.id = session.id;
    resource.createdAt = session.createdAt;
    resource.lastUsedAt = session.lastActiveAt;
    resource.expiresAt = session.expiresAt;
    resource.revokedAt = null;
    resource.userAgent =
      typeof metadata['userAgent'] === 'string'
        ? (metadata['userAgent'] as string)
        : null;
    resource.ipAddress =
      typeof metadata['ipAddress'] === 'string'
        ? (metadata['ipAddress'] as string)
        : null;
    resource.isCurrent =
      currentSessionId !== undefined && session.id === currentSessionId;
    return resource;
  }
}
