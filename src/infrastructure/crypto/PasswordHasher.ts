import { PasswordHash } from "../../domain/valueObjects/PasswordHash.js";

export interface PasswordHasher {
  hash(plain: string): Promise<PasswordHash>;
  verify(plain: string, hash: PasswordHash): Promise<boolean>;
}
