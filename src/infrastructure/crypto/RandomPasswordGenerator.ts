import crypto from "node:crypto";
import type { PasswordGenerator } from "./PasswordGenerator.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // 0/O/1/I/l除外

export class RandomPasswordGenerator implements PasswordGenerator {
  constructor(private length: number = 14) {}

  generate(): string {
    const bytes = crypto.randomBytes(this.length);
    let out = "";
    for (let i = 0; i < this.length; i++) {
      out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
  }
}
