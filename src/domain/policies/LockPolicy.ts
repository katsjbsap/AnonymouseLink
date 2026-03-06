export interface LockPolicy {
  readonly maxAttempts: number;
  readonly lockDurationMs: number;
  shouldLock(failedAttempts: number): boolean;
  calcLockedUntil(now: Date): Date;
}

export class SimpleLockPolicy implements LockPolicy {
  public readonly maxAttempts: number;
  public readonly lockDurationMs: number;

  constructor(args?: { maxAttempts?: number; lockDurationMs?: number }) {
    this.maxAttempts = args?.maxAttempts ?? 10;
    this.lockDurationMs = args?.lockDurationMs ?? 5 * 60 * 1000;
  }

  shouldLock(failedAttempts: number): boolean {
    return failedAttempts >= this.maxAttempts;
  }

  calcLockedUntil(now: Date): Date {
    return new Date(now.getTime() + this.lockDurationMs);
  }
}
