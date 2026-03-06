import { Token } from "../../domain/valueObjects/Token.js";
import type { AnonymousLinkRepository } from "../../infrastructure/repositories/AnonymousLinkRepository.js";
import type { PasswordHasher } from "../../infrastructure/crypto/PasswordHasher.js";
import type { Clock } from "../../infrastructure/time/Clock.js";
import type { LockPolicy } from "../../domain/policies/LockPolicy.js";

export type AuthInput = { token: string; password: string };
export type AuthOutput =
  | { ok: true; redirectTo?: string }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "LOCKED" | "BAD_PASSWORD" };

export class AuthenticateAnonymousLinkUseCase {
  constructor(
    private repo: AnonymousLinkRepository,
    private hasher: PasswordHasher,
    private clock: Clock,
    private lockPolicy: LockPolicy
  ) {}

  async execute(input: AuthInput): Promise<AuthOutput> {
    const now = this.clock.now();
    const token = new Token(input.token);

    const link = await this.repo.findByToken(token);
    if (!link || link.isDeleted()) return { ok: false, reason: "NOT_FOUND" };
    if (link.isExpired(now)) return { ok: false, reason: "EXPIRED" };
    if (!link.canAttempt(now)) return { ok: false, reason: "LOCKED" };

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
