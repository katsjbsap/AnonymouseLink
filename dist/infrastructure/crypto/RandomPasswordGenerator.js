import crypto from "node:crypto";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // 0/O/1/I/l除外
export class RandomPasswordGenerator {
    length;
    constructor(length = 14) {
        this.length = length;
    }
    generate() {
        const bytes = crypto.randomBytes(this.length);
        let out = "";
        for (let i = 0; i < this.length; i++) {
            out += ALPHABET[bytes[i] % ALPHABET.length];
        }
        return out;
    }
}
