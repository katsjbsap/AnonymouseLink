import type { PurgeExpiredLinksUseCase } from "../application/usecases/PurgeExpiredLinksUseCase.js";

export class ExpiredLinkJanitor {
  constructor(
    private purgeUC: PurgeExpiredLinksUseCase,
    private logger: { info: (msg: string) => void; error: (msg: string) => void } = console
  ) {}

  async run(): Promise<void> {
    try {
      const out = await this.purgeUC.execute();
      if (out.purgedCount > 0) this.logger.info(`[janitor] purged ${out.purgedCount} expired links`);
    } catch (e: any) {
      this.logger.error(`[janitor] error: ${e?.message ?? String(e)}`);
    }
  }
}
