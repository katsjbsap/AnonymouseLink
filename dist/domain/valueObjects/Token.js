export class Token {
    value;
    constructor(value) {
        // base64url/hexなど想定。必要に応じて制約を強めてください。
        if (!value || value.length < 16)
            throw new Error("Invalid token (too short).");
        this.value = value;
    }
}
