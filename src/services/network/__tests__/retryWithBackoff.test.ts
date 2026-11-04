import { describe, it, expect, vi } from 'vitest';
import { RetryWithBackoff } from '../retryWithBackoff';

describe('RetryWithBackoff & Network Resilience', () => {
  it('returns result immediately on first successful attempt', async () => {
    const mockOp = vi.fn().mockResolvedValue('success_payload');

    const result = await RetryWithBackoff.execute(mockOp);

    expect(result).toBe('success_payload');
    expect(mockOp).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and resolves when subsequent attempt succeeds', async () => {
    let callCount = 0;
    const mockOp = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Transient 503 Service Unavailable');
      }
      return 'recovered_data';
    });

    const result = await RetryWithBackoff.execute(mockOp, {
      maxRetries: 3,
      initialDelayMs: 1,
      maxDelayMs: 5,
    });

    expect(result).toBe('recovered_data');
    expect(mockOp).toHaveBeenCalledTimes(3);
  });

  it('exhausts max retries and throws the final error', async () => {
    const mockOp = vi.fn().mockRejectedValue(new Error('Persistent 500 Server Error'));

    await expect(
      RetryWithBackoff.execute(mockOp, {
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 5,
      })
    ).rejects.toThrow('Persistent 500 Server Error');

    expect(mockOp).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('respects shouldRetry predicate to abort non-retryable errors immediately', async () => {
    const mockOp = vi.fn().mockRejectedValue(new Error('Fatal 401 Unauthorized'));

    await expect(
      RetryWithBackoff.execute(mockOp, {
        maxRetries: 3,
        shouldRetry: (err) => !(err instanceof Error && err.message.includes('401')),
      })
    ).rejects.toThrow('Fatal 401 Unauthorized');

    expect(mockOp).toHaveBeenCalledTimes(1); // aborted on first attempt
  });
});

