import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LockLeaseManager } from '../lockLeaseManager';

describe('LockLeaseManager & Concurrency Safety', () => {
  let manager: LockLeaseManager;

  beforeEach(() => {
    manager = new LockLeaseManager();
    vi.useRealTimers();
  });

  it('acquires new lock lease when resource is free', () => {
    const lease = manager.acquireLease('src/index.ts', 'agent-alpha', 3000);

    expect(lease).toBeDefined();
    expect(lease?.holderId).toBe('agent-alpha');
    expect(lease?.resourceKey).toBe('src/index.ts');
    expect(manager.isLocked('src/index.ts')).toBe(true);
  });

  it('prevents another agent from acquiring an active lease', () => {
    manager.acquireLease('src/index.ts', 'agent-alpha', 3000);
    const rival = manager.acquireLease('src/index.ts', 'agent-beta', 3000);

    expect(rival).toBeNull();
  });

  it('renews lease if valid and unexpired', () => {
    const lease = manager.acquireLease('src/index.ts', 'agent-alpha', 1000);
    expect(lease).toBeDefined();

    const renewed = manager.renewLease('src/index.ts', lease!.leaseId, 2000);
    expect(renewed).toBe(true);
  });

  it('rejects renewal with mismatched lease ID', () => {
    manager.acquireLease('src/index.ts', 'agent-alpha', 1000);
    const renewed = manager.renewLease('src/index.ts', 'invalid-lease-id', 2000);

    expect(renewed).toBe(false);
  });

  it('automatically purges expired leases and allows reacquisition', () => {
    vi.useFakeTimers();
    manager.acquireLease('src/index.ts', 'agent-alpha', 500);

    vi.advanceTimersByTime(600);
    expect(manager.isLocked('src/index.ts')).toBe(false);

    const reacquired = manager.acquireLease('src/index.ts', 'agent-beta', 500);
    expect(reacquired?.holderId).toBe('agent-beta');
  });

  it('releases lease cleanly', () => {
    const lease = manager.acquireLease('src/index.ts', 'agent-alpha', 3000);
    const released = manager.releaseLease('src/index.ts', lease!.leaseId);

    expect(released).toBe(true);
    expect(manager.isLocked('src/index.ts')).toBe(false);
  });
});
