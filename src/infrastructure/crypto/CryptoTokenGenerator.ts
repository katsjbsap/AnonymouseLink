import crypto from "node:crypto";
import { Token } from "../../domain/valueObjects/Token.js";
import type { TokenGenerator } from "./TokenGenerator.js";

export class CryptoTokenGenerator implements TokenGenerator {
  constructor(private bytes: number = 24) {}

  generate(): Token {
    // base64url: Node 16+ supports 'base64url'
    const token = crypto.randomBytes(this.bytes).toString("base64url");
    return new Token(token);
  }
}
