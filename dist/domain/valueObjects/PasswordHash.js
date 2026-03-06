export class PasswordHash {
    value;
    constructor(value) {
        if (!value)
            throw new Error("Invalid password hash.");
        this.value = value;
    }
}
