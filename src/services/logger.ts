/**
 * Structured Logging Framework for Vertex Forge
 * Provides structured log levels, metadata context, error cause preservation,
 * in-memory ring-buffer history, and real-time subscriber channels.
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

class StructuredLogger {
  private minLevel: LogLevel = 'info';
  private bufferSize: number = 200;
  private history: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

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

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>, cause?: unknown): void {
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
      ...(cause !== undefined ? { cause } : {}),
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

  public debug(message: string, context?: Record<string, unknown>, cause?: unknown): void {
    this.emit('debug', message, context, cause);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.emit('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>, cause?: unknown): void {
    this.emit('warn', message, context, cause);
  }

  public error(message: string, context?: Record<string, unknown>, cause?: unknown): void {
    this.emit('error', message, context, cause);
  }
}

export const logger = new StructuredLogger();
