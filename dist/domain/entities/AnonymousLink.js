import { Token } from "../valueObjects/Token.js";
import { OwnerId } from "../valueObjects/OwnerId.js";
import { PasswordHash } from "../valueObjects/PasswordHash.js";
export class AnonymousLink {
    id;
    token;
    owner;
    passwordHash;
    createdAt;
    expiresAt;
    deletedAt;
    stats;
    meta;
    constructor(id, token, owner, passwordHash, createdAt, expiresAt, deletedAt, stats, meta = {}) {
        this.id = id;
        this.token = token;
        this.owner = owner;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.deletedAt = deletedAt;
        this.stats = stats;
        this.meta = meta;
    }
    isExpired(now) {
        return now.getTime() >= this.expiresAt.getTime();
    }
    isDeleted() {
        return this.deletedAt !== null;
    }
    canAttempt(now) {
        if (this.isDeleted())
            return false;
        if (this.isExpired(now))
            return false;
        if (this.stats.lockedUntil && now.getTime() < this.stats.lockedUntil.getTime())
            return false;
        return true;
    }
    recordSuccess(now) {
        this.stats.accessCount += 1;
        this.stats.lastAccessAt = now;
        this.stats.failedAttempts = 0;
        this.stats.lockedUntil = null;
    }
    recordFailure(now, policy) {
        this.stats.failedAttempts += 1;
        if (policy.shouldLock(this.stats.failedAttempts)) {
            this.stats.lockedUntil = policy.calcLockedUntil(now);
        }
    }
    markDeleted(now) {
        this.deletedAt = now;
    }
    getExpiresAt() {
        return this.expiresAt;
    }
    getTargetUrl() {
        return this.meta.targetUrl;
    }
    getPasswordHash() {
        return this.passwordHash;
    }
    toRecord() {
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
    static fromRecord(r) {
        return new AnonymousLink(r.id, new Token(r.token), new OwnerId(r.userId), new PasswordHash(r.passwordHash), new Date(r.createdAt), new Date(r.expiresAt), r.deletedAt ? new Date(r.deletedAt) : null, {
            accessCount: r.stats.accessCount,
            lastAccessAt: r.stats.lastAccessAt ? new Date(r.stats.lastAccessAt) : null,
            failedAttempts: r.stats.failedAttempts,
            lockedUntil: r.stats.lockedUntil ? new Date(r.stats.lockedUntil) : null
        }, r.meta ?? {});
    }
}
