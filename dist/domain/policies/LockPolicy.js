export class SimpleLockPolicy {
    maxAttempts;
    lockDurationMs;
    constructor(args) {
        this.maxAttempts = args?.maxAttempts ?? 10;
        this.lockDurationMs = args?.lockDurationMs ?? 5 * 60 * 1000;
    }
    shouldLock(failedAttempts) {
        return failedAttempts >= this.maxAttempts;
    }
    calcLockedUntil(now) {
        return new Date(now.getTime() + this.lockDurationMs);
    }
}
