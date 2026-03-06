import crypto from "node:crypto";
import { Token } from "../../domain/valueObjects/Token.js";
export class CryptoTokenGenerator {
    bytes;
    constructor(bytes = 24) {
        this.bytes = bytes;
    }
    generate() {
        // base64url: Node 16+ supports 'base64url'
        const token = crypto.randomBytes(this.bytes).toString("base64url");
        return new Token(token);
    }
}
