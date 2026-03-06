export class DeleteAnonymousLinkUseCase {
    repo;
    clock;
    constructor(repo, clock) {
        this.repo = repo;
        this.clock = clock;
    }
    async execute(input) {
        const link = await this.repo.findById(input.id);
        if (!link)
            return;
        // owner check
        if (link.owner.value !== input.userId)
            throw new Error("Forbidden");
        // physical delete (要件4の削除と同様)
        await this.repo.deleteById(input.id);
    }
}
