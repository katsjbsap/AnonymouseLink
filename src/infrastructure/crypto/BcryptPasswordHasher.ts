import bcrypt from "bcrypt";
import { PasswordHash } from "../../domain/valueObjects/PasswordHash.js";
import type { PasswordHasher } from "./PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private rounds: number = 12) {}

  async hash(plain: string): Promise<PasswordHash> {
    const h = await bcrypt.hash(plain, this.rounds);
    return new PasswordHash(h);
  }

  async verify(plain: string, hash: PasswordHash): Promise<boolean> {
    return bcrypt.compare(plain, hash.value);
  }
}
