export class OwnerId {
    value;
    constructor(value) {
        if (!value)
            throw new Error("Invalid ownerId.");
        this.value = value;
    }
}
