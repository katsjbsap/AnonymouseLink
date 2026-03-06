import crypto from "node:crypto";
import { AnonymousLink } from "../../domain/entities/AnonymousLink.js";
import { OwnerId } from "../../domain/valueObjects/OwnerId.js";
import type { AnonymousLinkRepository } from "../../infrastructure/repositories/AnonymousLinkRepository.js";
import type { TokenGenerator } from "../../infrastructure/crypto/TokenGenerator.js";
import type { PasswordGenerator } from "../../infrastructure/crypto/PasswordGenerator.js";
import type { PasswordHasher } from "../../infrastructure/crypto/PasswordHasher.js";
import type { Clock } from "../../infrastructure/time/Clock.js";
import type { LinkConfig } from "../config/LinkConfig.js";

export type CreateAnonymousLinkInput = {
  userId: string;
  ttlSeconds: number;
  targetUrl?: string;
  note?: string;
};

export type CreateAnonymousLinkOutput = {
  id: string;
  url: string;
  password: string;
  expiresAt: string;
};

export class CreateAnonymousLinkUseCase {
  constructor(
    private repo: AnonymousLinkRepository,
    private tokenGen: TokenGenerator,
    private passwordGen: PasswordGenerator,
    private hasher: PasswordHasher,
    private clock: Clock,
    private config: LinkConfig
  ) {}

  async execute(input: CreateAnonymousLinkInput): Promise<CreateAnonymousLinkOutput> {
    const now = this.clock.now();
    const ttl = Math.min(input.ttlSeconds, this.config.maxTtlSeconds);
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const id = crypto.randomUUID();
    const token = this.tokenGen.generate();
    const password = this.passwordGen.generate();
    const passwordHash = await this.hasher.hash(password);

    const link = new AnonymousLink(
      id,
      token,
      new OwnerId(input.userId),
      passwordHash,
      now,
      expiresAt,
      null,
      { accessCount: 0, lastAccessAt: null, failedAttempts: 0, lockedUntil: null },
      { targetUrl: input.targetUrl, note: input.note }
    );

    await this.repo.save(link);

    return {
      id,
      url: `${this.config.baseUrl}/a/${token.value}`,
      password,
      expiresAt: expiresAt.toISOString()
    };
  }
}
