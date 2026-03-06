export class PasswordHash {
  public readonly value: string;
  constructor(value: string) {
    if (!value) throw new Error("Invalid password hash.");
    this.value = value;
  }
}
