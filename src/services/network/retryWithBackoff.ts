/**
 * HTTP Retry with Exponential Backoff & Full Jitter
 * Conforms to AWS Architecture best practices for transient network and rate-limit recovery.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export class RetryWithBackoff {
  public static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelayMs = 100,
      maxDelayMs = 3000,
      backoffFactor = 2,
      shouldRetry = () => true,
    } = options;

    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (err) {
        attempt++;
        if (attempt > maxRetries || !shouldRetry(err, attempt)) {
          throw err;
        }

        // Exponential backoff calculation
        const calculatedDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
        const cappedDelay = Math.min(calculatedDelay, maxDelayMs);

        // Full jitter: random between 0 and capped delay to prevent thundering herd
        const jitteredDelay = Math.floor(Math.random() * cappedDelay);

        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw new Error('Retry loop terminated unexpectedly');
  }
}

