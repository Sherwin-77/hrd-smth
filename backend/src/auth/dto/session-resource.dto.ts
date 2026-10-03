import type { SessionRecord } from '@nestjs/authentication';

export class SessionResourceDto {
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
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
