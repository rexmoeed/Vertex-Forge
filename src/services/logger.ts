/* eslint-disable no-console */
/**
 * ==============================================================================
 * Vertex Forge Structured Logging & Error Tracking Framework
 * ==============================================================================
 * Logging Contract & Specification:
 * - Levels:
 *     - 'debug': Verbose diagnostic information for development and tracing.
 *     - 'info':  Milestone events (workspace load, server ready, agent dispatch).
 *     - 'warn':  Degraded states, recoverable network errors, and fallback paths.
 *     - 'error': Fatal operations, uncaught exceptions, and unrecoverable failures.
 * - Structured Fields:
 *     - timestamp: Strict ISO 8601 UTC timestamp format.
 *     - level: Strict LogLevel union ('debug' | 'info' | 'warn' | 'error').
 *     - message: Human-readable description of the log event.
 *     - context: Record<string, unknown> carrying metadata envelopes (workspace, ids).
 *     - cause: Optional unredacted underlying Error object or reason.
 * - JSON Telemetry:
 *     - Supports standardized JSON serialization for automated ingest and CI logs.
 * ==============================================================================
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export type LogListener = (entry: LogEntry) => void;

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger {
  private minLevel: LogLevel = 'info';
  private bufferSize: number = 200;
  private history: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private emitJson: boolean = false;

  constructor() {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      this.minLevel = 'debug';
    }
  }

  public setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public getLevel(): LogLevel {
    return this.minLevel;
  }

  public setEmitJson(enabled: boolean): void {
    this.emitJson = enabled;
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getHistory(limit?: number): LogEntry[] {
    if (limit && limit > 0) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  public formatJson(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...(entry.context ? { context: entry.context } : {}),
      ...(entry.cause instanceof Error
        ? { error: { message: entry.cause.message, stack: entry.cause.stack } }
        : entry.cause
        ? { error: entry.cause }
        : {}),
    });
  }

  private emit(level: LogLevel, message: string, context?: unknown, cause?: unknown): void {
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[this.minLevel]) {
      return;
    }

    const ctx = typeof context === 'object' && context !== null && !(context instanceof Error)
      ? (context as Record<string, unknown>)
      : context !== undefined
        ? { value: context }
        : undefined;
    const actualCause = cause !== undefined ? cause : (context instanceof Error ? context : undefined);

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(ctx && Object.keys(ctx).length > 0 ? { context: ctx } : {}),
      ...(actualCause !== undefined ? { cause: actualCause } : {}),
    };

    this.history.push(entry);
    if (this.history.length > this.bufferSize) {
      this.history.shift();
    }

    // Notify active subscribers
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error('[StructuredLogger] Subscriber error:', err);
      }
    }

    if (this.emitJson) {
      const jsonStr = this.formatJson(entry);
      switch (level) {
        case 'debug': console.debug(jsonStr); break;
        case 'info': console.info(jsonStr); break;
        case 'warn': console.warn(jsonStr); break;
        case 'error': console.error(jsonStr); break;
      }
      return;
    }

    // Output formatted console messages
    const prefix = `[VertexForge:${level.toUpperCase()}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, context || '', cause || '');
        break;
      case 'info':
        console.info(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '', cause || '');
        break;
      case 'error':
        console.error(prefix, message, context || '', cause || '');
        break;
    }
  }

  public debug(message: string, context?: unknown, cause?: unknown): void {
    this.emit('debug', message, context, cause);
  }

  public info(message: string, context?: unknown): void {
    this.emit('info', message, context);
  }

  public warn(message: string, context?: unknown, cause?: unknown): void {
    this.emit('warn', message, context, cause);
  }

  public error(message: string, context?: unknown, cause?: unknown): void {
    this.emit('error', message, context, cause);

    // Remote error tracking forwarder (Sentry / Webhook telemetry)
    const sentryDsn = typeof process !== 'undefined' ? process.env?.SENTRY_DSN : undefined;
    if (sentryDsn && typeof fetch === 'function') {
      try {
        fetch(sentryDsn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context,
            cause: cause instanceof Error ? { message: cause.message, stack: cause.stack } : cause,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}
    }
  }
}

export const logger = new StructuredLogger();

export class ErrorTracker {
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('error', (event: ErrorEvent) => {
      logger.error('Unhandled window runtime error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, event.error);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      logger.error('Unhandled Promise rejection', {
        reason: event.reason?.message || String(event.reason),
      }, event.reason);
    });
  }

  public static captureException(error: Error | unknown, context?: Record<string, unknown>): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg, context, error);
  }
}
