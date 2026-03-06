export class ExpiredLinkJanitor {
    purgeUC;
    logger;
    constructor(purgeUC, logger = console) {
        this.purgeUC = purgeUC;
        this.logger = logger;
    }
    async run() {
        try {
            const out = await this.purgeUC.execute();
            if (out.purgedCount > 0)
                this.logger.info(`[janitor] purged ${out.purgedCount} expired links`);
        }
        catch (e) {
            this.logger.error(`[janitor] error: ${e?.message ?? String(e)}`);
        }
    }
}
