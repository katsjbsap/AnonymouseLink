import bcrypt from "bcrypt";
import { PasswordHash } from "../../domain/valueObjects/PasswordHash.js";
export class BcryptPasswordHasher {
    rounds;
    constructor(rounds = 12) {
        this.rounds = rounds;
    }
    async hash(plain) {
        const h = await bcrypt.hash(plain, this.rounds);
        return new PasswordHash(h);
    }
    async verify(plain, hash) {
        return bcrypt.compare(plain, hash.value);
    }
}
