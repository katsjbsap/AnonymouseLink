import type { AnonymousLinkRepository } from "../../infrastructure/repositories/AnonymousLinkRepository.js";
import type { Clock } from "../../infrastructure/time/Clock.js";

export type PurgeOutput = { purgedCount: number };

export class PurgeExpiredLinksUseCase {
  constructor(private repo: AnonymousLinkRepository, private clock: Clock) {}

  async execute(): Promise<PurgeOutput> {
    const now = this.clock.now();
    const expired = await this.repo.listExpired(now);

    for (const link of expired) {
      await this.repo.deleteById(link.id);
    }

    return { purgedCount: expired.length };
  }
}
