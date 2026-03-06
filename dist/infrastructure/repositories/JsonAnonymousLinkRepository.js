import { AnonymousLink } from "../../domain/entities/AnonymousLink.js";
// Simple in-process mutex (single node process)
class Mutex {
    queue = Promise.resolve();
    async runExclusive(fn) {
        const prev = this.queue;
        let release;
        this.queue = new Promise((r) => (release = r));
        await prev;
        try {
            return await fn();
        }
        finally {
            release();
        }
    }
}
export class JsonAnonymousLinkRepository {
    store;
    mutex = new Mutex();
    constructor(store) {
        this.store = store;
    }
    async findByToken(token) {
        const file = await this.store.read();
        const rec = file.links.find((l) => l.token === token.value) ?? null;
        return rec ? AnonymousLink.fromRecord(rec) : null;
    }
    async findById(id) {
        const file = await this.store.read();
        const rec = file.links.find((l) => l.id === id) ?? null;
        return rec ? AnonymousLink.fromRecord(rec) : null;
    }
    async save(link) {
        await this.mutex.runExclusive(async () => {
            const file = await this.store.read();
            const rec = link.toRecord();
            const idx = file.links.findIndex((l) => l.id === rec.id);
            if (idx >= 0)
                file.links[idx] = rec;
            else
                file.links.push(rec);
            await this.store.write(file);
        });
    }
    async deleteById(id) {
        await this.mutex.runExclusive(async () => {
            const file = await this.store.read();
            file.links = file.links.filter((l) => l.id !== id);
            await this.store.write(file);
        });
    }
    async listExpired(now) {
        const file = await this.store.read();
        return file.links
            .map(AnonymousLink.fromRecord)
            .filter((l) => !l.isDeleted() && l.isExpired(now));
    }
}
