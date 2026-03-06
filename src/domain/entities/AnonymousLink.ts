import { Token } from "../valueObjects/Token.js";
import { OwnerId } from "../valueObjects/OwnerId.js";
import { PasswordHash } from "../valueObjects/PasswordHash.js";
import type { LockPolicy } from "../policies/LockPolicy.js";
import type { LinkRecord } from "../../infrastructure/repositories/types.js";

export type LinkMeta = { targetUrl?: string; note?: string };
export type LinkStats = {
  accessCount: number;
  lastAccessAt: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
};

export class AnonymousLink {
  constructor(
    public readonly id: string,
    public readonly token: Token,
    public readonly owner: OwnerId,
    private passwordHash: PasswordHash,
    private createdAt: Date,
    private expiresAt: Date,
    private deletedAt: Date | null,
    private stats: LinkStats,
    private meta: LinkMeta = {}
  ) {}

  isExpired(now: Date): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  canAttempt(now: Date): boolean {
    if (this.isDeleted()) return false;
    if (this.isExpired(now)) return false;
    if (this.stats.lockedUntil && now.getTime() < this.stats.lockedUntil.getTime()) return false;
    return true;
  }

  recordSuccess(now: Date): void {
    this.stats.accessCount += 1;
    this.stats.lastAccessAt = now;
    this.stats.failedAttempts = 0;
    this.stats.lockedUntil = null;
  }

  recordFailure(now: Date, policy: LockPolicy): void {
    this.stats.failedAttempts += 1;
    if (policy.shouldLock(this.stats.failedAttempts)) {
      this.stats.lockedUntil = policy.calcLockedUntil(now);
    }
  }

  markDeleted(now: Date): void {
    this.deletedAt = now;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getTargetUrl(): string | undefined {
    return this.meta.targetUrl;
  }

  getPasswordHash(): PasswordHash {
    return this.passwordHash;
  }

  toRecord(): LinkRecord {
    return {
      id: this.id,
      token: this.token.value,
      passwordHash: this.passwordHash.value,
      userId: this.owner.value,
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
      meta: this.meta,
      stats: {
        accessCount: this.stats.accessCount,
        lastAccessAt: this.stats.lastAccessAt ? this.stats.lastAccessAt.toISOString() : null,
        failedAttempts: this.stats.failedAttempts,
        lockedUntil: this.stats.lockedUntil ? this.stats.lockedUntil.toISOString() : null
      }
    };
  }

  static fromRecord(r: LinkRecord): AnonymousLink {
    return new AnonymousLink(
      r.id,
      new Token(r.token),
      new OwnerId(r.userId),
      new PasswordHash(r.passwordHash),
      new Date(r.createdAt),
      new Date(r.expiresAt),
      r.deletedAt ? new Date(r.deletedAt) : null,
      {
        accessCount: r.stats.accessCount,
        lastAccessAt: r.stats.lastAccessAt ? new Date(r.stats.lastAccessAt) : null,
        failedAttempts: r.stats.failedAttempts,
        lockedUntil: r.stats.lockedUntil ? new Date(r.stats.lockedUntil) : null
      },
      r.meta ?? {}
    );
  }
}
