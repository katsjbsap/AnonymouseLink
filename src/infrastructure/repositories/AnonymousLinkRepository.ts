import { Token } from "../../domain/valueObjects/Token.js";
import { AnonymousLink } from "../../domain/entities/AnonymousLink.js";

export interface AnonymousLinkRepository {
  findByToken(token: Token): Promise<AnonymousLink | null>;
  findById(id: string): Promise<AnonymousLink | null>;
  save(link: AnonymousLink): Promise<void>;        // upsert
  deleteById(id: string): Promise<void>;
  listExpired(now: Date): Promise<AnonymousLink[]>;
}
