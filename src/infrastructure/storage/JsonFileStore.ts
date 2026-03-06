import { promises as fs } from "node:fs";
import path from "node:path";

export class JsonFileStore<T> {
  constructor(private filepath: string) {}

  async read(): Promise<T> {
    const raw = await fs.readFile(this.filepath, "utf-8");
    return JSON.parse(raw) as T;
  }

  async write(data: T): Promise<void> {
    // atomic write: write to tmp then rename
    const dir = path.dirname(this.filepath);
    const tmp = path.join(dir, `.${path.basename(this.filepath)}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmp, this.filepath);
  }
}
