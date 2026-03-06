import type { AnonymousLinkRepository } from "../../infrastructure/repositories/AnonymousLinkRepository.js";
import type { Clock } from "../../infrastructure/time/Clock.js";

export type DeleteInput = { id: string; userId: string };

export class DeleteAnonymousLinkUseCase {
  constructor(private repo: AnonymousLinkRepository, private clock: Clock) {}

  async execute(input: DeleteInput): Promise<void> {
    const link = await this.repo.findById(input.id);
    if (!link) return;
    // owner check
    if (link.owner.value !== input.userId) throw new Error("Forbidden");
    // physical delete (要件4の削除と同様)
    await this.repo.deleteById(input.id);
  }
}
