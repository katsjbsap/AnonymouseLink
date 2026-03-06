import crypto from "node:crypto";
import { AnonymousLink } from "../../domain/entities/AnonymousLink.js";
import { OwnerId } from "../../domain/valueObjects/OwnerId.js";
export class CreateAnonymousLinkUseCase {
    repo;
    tokenGen;
    passwordGen;
    hasher;
    clock;
    config;
    constructor(repo, tokenGen, passwordGen, hasher, clock, config) {
        this.repo = repo;
        this.tokenGen = tokenGen;
        this.passwordGen = passwordGen;
        this.hasher = hasher;
        this.clock = clock;
        this.config = config;
    }
    async execute(input) {
        const now = this.clock.now();
        const ttl = Math.min(input.ttlSeconds, this.config.maxTtlSeconds);
        const expiresAt = new Date(now.getTime() + ttl * 1000);
        const id = crypto.randomUUID();
        const token = this.tokenGen.generate();
        const password = this.passwordGen.generate();
        const passwordHash = await this.hasher.hash(password);
        const link = new AnonymousLink(id, token, new OwnerId(input.userId), passwordHash, now, expiresAt, null, { accessCount: 0, lastAccessAt: null, failedAttempts: 0, lockedUntil: null }, { targetUrl: input.targetUrl, note: input.note });
        await this.repo.save(link);
        return {
            id,
            url: `${this.config.baseUrl}/a/${token.value}`,
            password,
            expiresAt: expiresAt.toISOString()
        };
    }
}
