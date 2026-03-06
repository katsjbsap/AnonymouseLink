export class PurgeExpiredLinksUseCase {
    repo;
    clock;
    constructor(repo, clock) {
        this.repo = repo;
        this.clock = clock;
    }
    async execute() {
        const now = this.clock.now();
        const expired = await this.repo.listExpired(now);
        for (const link of expired) {
            await this.repo.deleteById(link.id);
        }
        return { purgedCount: expired.length };
    }
}
