import { Token } from "../../domain/valueObjects/Token.js";
import { AnonymousLink } from "../../domain/entities/AnonymousLink.js";
import type { AnonymousLinkRepository } from "./AnonymousLinkRepository.js";
import type { LinksFile, LinkRecord } from "./types.js";
import { JsonFileStore } from "../storage/JsonFileStore.js";

// Simple in-process mutex (single node process)
class Mutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((r) => (release = r));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export class JsonAnonymousLinkRepository implements AnonymousLinkRepository {
  private mutex = new Mutex();

  constructor(private store: JsonFileStore<LinksFile>) {}

  async findByToken(token: Token): Promise<AnonymousLink | null> {
    const file = await this.store.read();
    const rec = file.links.find((l) => l.token === token.value) ?? null;
    return rec ? AnonymousLink.fromRecord(rec) : null;
  }

  async findById(id: string): Promise<AnonymousLink | null> {
    const file = await this.store.read();
    const rec = file.links.find((l) => l.id === id) ?? null;
    return rec ? AnonymousLink.fromRecord(rec) : null;
  }

  async save(link: AnonymousLink): Promise<void> {
    await this.mutex.runExclusive(async () => {
      const file = await this.store.read();
      const rec = link.toRecord();
      const idx = file.links.findIndex((l) => l.id === rec.id);
      if (idx >= 0) file.links[idx] = rec;
      else file.links.push(rec);
      await this.store.write(file);
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      const file = await this.store.read();
      file.links = file.links.filter((l) => l.id !== id);
      await this.store.write(file);
    });
  }

  async listExpired(now: Date): Promise<AnonymousLink[]> {
    const file = await this.store.read();
    return file.links
      .map(AnonymousLink.fromRecord)
      .filter((l) => !l.isDeleted() && l.isExpired(now));
  }
}
