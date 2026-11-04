/**
 * Distributed Lock Lease Manager
 * Manages timed leases for workspace resources, preventing deadlocks when agents fail.
 */

export interface LockLease {
  leaseId: string;
  resourceKey: string;
  holderId: string;
  grantedAt: number;
  expiresAt: number;
  ttlMs: number;
}

export class LockLeaseManager {
  private leases = new Map<string, LockLease>();

  public acquireLease(resourceKey: string, holderId: string, ttlMs = 5000): LockLease | null {
    this.purgeExpired();
    const existing = this.leases.get(resourceKey);

    if (existing && existing.holderId !== holderId) {
      return null;
    }

    const now = Date.now();
    const lease: LockLease = {
      leaseId: `lease_${now}_${Math.random().toString(36).substring(2, 8)}`,
      resourceKey,
      holderId,
      grantedAt: now,
      expiresAt: now + ttlMs,
      ttlMs,
    };

    this.leases.set(resourceKey, lease);
    return lease;
  }

  public renewLease(resourceKey: string, leaseId: string, additionalTtlMs?: number): boolean {
    const existing = this.leases.get(resourceKey);
    if (!existing || existing.leaseId !== leaseId) {
      return false;
    }

    const now = Date.now();
    if (now > existing.expiresAt) {
      this.leases.delete(resourceKey);
      return false;
    }

    const ttl = additionalTtlMs ?? existing.ttlMs;
    existing.expiresAt = now + ttl;
    return true;
  }

  public releaseLease(resourceKey: string, leaseId: string): boolean {
    const existing = this.leases.get(resourceKey);
    if (!existing || existing.leaseId !== leaseId) {
      return false;
    }

    this.leases.delete(resourceKey);
    return true;
  }

  public isLocked(resourceKey: string): boolean {
    this.purgeExpired();
    return this.leases.has(resourceKey);
  }

  public getActiveLeases(): LockLease[] {
    this.purgeExpired();
    return Array.from(this.leases.values());
  }

  public purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, lease] of this.leases.entries()) {
      if (now >= lease.expiresAt) {
        this.leases.delete(key);
        purged++;
      }
    }
    return purged;
  }
}

export const lockLeaseManager = new LockLeaseManager();
