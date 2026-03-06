export class OwnerId {
  public readonly value: string;
  constructor(value: string) {
    if (!value) throw new Error("Invalid ownerId.");
    this.value = value;
  }
}
