import { Token } from "../../domain/valueObjects/Token.js";
export class AuthenticateAnonymousLinkUseCase {
    repo;
    hasher;
    clock;
    lockPolicy;
    constructor(repo, hasher, clock, lockPolicy) {
        this.repo = repo;
        this.hasher = hasher;
        this.clock = clock;
        this.lockPolicy = lockPolicy;
    }
    async execute(input) {
        const now = this.clock.now();
        const token = new Token(input.token);
        const link = await this.repo.findByToken(token);
        if (!link || link.isDeleted())
            return { ok: false, reason: "NOT_FOUND" };
        if (link.isExpired(now))
            return { ok: false, reason: "EXPIRED" };
        if (!link.canAttempt(now))
            return { ok: false, reason: "LOCKED" };
        const ok = await this.hasher.verify(input.password, link.getPasswordHash());
        if (!ok) {
            link.recordFailure(now, this.lockPolicy);
            await this.repo.save(link);
            return { ok: false, reason: "BAD_PASSWORD" };
        }
        link.recordSuccess(now);
        await this.repo.save(link);
        return { ok: true, redirectTo: link.getTargetUrl() };
    }
}
