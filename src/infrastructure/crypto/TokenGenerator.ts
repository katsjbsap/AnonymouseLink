import { Token } from "../../domain/valueObjects/Token.js";
export interface TokenGenerator {
  generate(): Token;
}
