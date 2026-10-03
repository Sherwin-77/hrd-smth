import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from '@nestjs/authentication';
import { IsNull, Repository } from 'typeorm';
import { EmployeeSession } from './entities/session.entity.js';

function toRecord(entity: EmployeeSession): SessionRecord {
  const metadata: Record<string, unknown> = {};
  if (entity.userAgent) {
    metadata.userAgent = entity.userAgent;
  }
  if (entity.ipAddress) {
    metadata.ipAddress = entity.ipAddress;
  }
  return {
    id: entity.tokenHash,
    userId: entity.employeeId,
    createdAt: entity.createdAt,
    expiresAt: entity.expiresAt,
    lastActiveAt: entity.lastUsedAt,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  };
}

/**
 * `SessionStore` backed by the existing `employee_sessions` table.
 *
 * The Nest session id (`SHA-256` of the opaque token) is stored in
 * `token_hash`; the `id` uuid column is left to its `UUIDV7()` default.
 * Rows revoked by the previous implementation (`revoked_at` set) are
 * treated as missing so pre-migration revocations stay revoked.
 */
@Injectable()
export class TypeOrmSessionStore implements SessionStore {
  constructor(
    @InjectRepository(EmployeeSession)
    private readonly sessions: Repository<EmployeeSession>,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ sessions: this });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const entity = await this.sessions.findOne({
      where: { tokenHash: id },
    });
    if (!entity || entity.revokedAt !== null) {
      return undefined;
    }
    return toRecord(entity);
  }

  async createSession(record: SessionRecord): Promise<void> {
    const metadata = record.metadata ?? {};
    const userAgent =
      typeof metadata['userAgent'] === 'string'
        ? (metadata['userAgent'] as string)
        : null;
    const ipAddress =
      typeof metadata['ipAddress'] === 'string'
        ? (metadata['ipAddress'] as string)
        : null;
    const entity = this.sessions.create({
      employeeId: record.userId,
      tokenHash: record.id,
      userAgent,
      ipAddress,
      createdAt: record.createdAt,
      lastUsedAt: record.lastActiveAt,
      expiresAt: record.expiresAt,
      revokedAt: null,
    });
    await this.sessions.save(entity);
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    await this.sessions
      .createQueryBuilder()
      .update(EmployeeSession)
      .set({ lastUsedAt: lastActiveAt })
      .where('token_hash = :id', { id })
      .andWhere('last_used_at < :lastActiveAt', { lastActiveAt })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.sessions.delete({ tokenHash: id });
    return (result.affected ?? 0) > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const entities = await this.sessions.find({
      where: { employeeId: userId, revokedAt: IsNull() },
    });
    return entities.map(toRecord);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.sessions.delete({ employeeId: userId });
  }
}
