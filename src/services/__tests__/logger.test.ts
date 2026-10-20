import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, LogEntry } from '../logger';

describe('StructuredLogger Engine', () => {
  beforeEach(() => {
    logger.clearHistory();
    logger.setLevel('debug');
  });

  it('records structured log entries with timestamp and severity', () => {
    logger.info('Project initialized', { workspace: '/app' });

    const history = logger.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].level).toBe('info');
    expect(history[0].message).toBe('Project initialized');
    expect(history[0].context).toEqual({ workspace: '/app' });
    expect(typeof history[0].timestamp).toBe('string');
  });

  it('preserves error cause in warn and error logs', () => {
    const errorCause = new Error('Git remote unreachable');
    logger.error('Failed to sync repository', { branch: 'main' }, errorCause);

    const history = logger.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].level).toBe('error');
    expect(history[0].cause).toBe(errorCause);
  });

  it('filters messages below configured minimum level', () => {
    logger.setLevel('warn');

    logger.debug('Debug tracing details');
    logger.info('Normal informational message');
    logger.warn('Resource warning');
    logger.error('Critical failure');

    const history = logger.getHistory();
    expect(history.length).toBe(2);
    expect(history.map(h => h.level)).toEqual(['warn', 'error']);
  });

  it('notifies active subscribers in real-time', () => {
    const received: LogEntry[] = [];
    const unsubscribe = logger.subscribe((entry) => {
      received.push(entry);
    });

    logger.info('Live stream update 1');
    logger.warn('Live stream update 2');

    expect(received.length).toBe(2);
    expect(received[0].message).toBe('Live stream update 1');

    unsubscribe();
    logger.info('Live stream update 3 (unsubscribed)');
    expect(received.length).toBe(2);
  });

  it('limits history to requested limit count', () => {
    for (let i = 0; i < 10; i++) {
      logger.info(`Message ${i}`);
    }

    const limited = logger.getHistory(3);
    expect(limited.length).toBe(3);
    expect(limited[2].message).toBe('Message 9');
  });
});
