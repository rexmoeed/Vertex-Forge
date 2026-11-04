/**
 * Performance Tracer & Telemetry Metric Collector
 * Provides microsecond performance measurement and rolling telemetry ring buffer.
 */

export interface PerformanceSpan {
  id: string;
  name: string;
  category: 'fs' | 'ai' | 'render' | 'network' | 'build';
  startTimeMs: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
  status: 'ok' | 'error';
}

export interface MetricSummary {
  count: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  p95DurationMs: number;
}

export class PerformanceTracer {
  private static instance: PerformanceTracer;
  private readonly maxBufferSize: number;
  private readonly buffer: PerformanceSpan[] = [];

  constructor(maxBufferSize = 500) {
    this.maxBufferSize = maxBufferSize;
  }

  public static getInstance(): PerformanceTracer {
    if (!PerformanceTracer.instance) {
      PerformanceTracer.instance = new PerformanceTracer();
    }
    return PerformanceTracer.instance;
  }

  public startSpan(name: string, category: PerformanceSpan['category'], metadata?: Record<string, unknown>): {
    end: (status?: 'ok' | 'error') => PerformanceSpan;
  } {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const id = `span_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      end: (status: 'ok' | 'error' = 'ok'): PerformanceSpan => {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const durationMs = Math.max(0, endTime - startTime);
        const span: PerformanceSpan = {
          id,
          name,
          category,
          startTimeMs: startTime,
          durationMs,
          metadata,
          status,
        };

        this.recordSpan(span);
        return span;
      },
    };
  }

  public recordSpan(span: PerformanceSpan): void {
    this.buffer.push(span);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  public getSpans(category?: PerformanceSpan['category']): PerformanceSpan[] {
    if (category) {
      return this.buffer.filter(s => s.category === category);
    }
    return [...this.buffer];
  }

  public getSummary(category?: PerformanceSpan['category']): MetricSummary {
    const spans = this.getSpans(category);
    if (spans.length === 0) {
      return {
        count: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        p95DurationMs: 0,
      };
    }

    const durations = spans.map(s => s.durationMs).sort((a, b) => a - b);
    const total = durations.reduce((acc, d) => acc + d, 0);
    const p95Index = Math.min(Math.floor(durations.length * 0.95), durations.length - 1);

    return {
      count: durations.length,
      totalDurationMs: Math.round(total * 100) / 100,
      avgDurationMs: Math.round((total / durations.length) * 100) / 100,
      minDurationMs: Math.round(durations[0] * 100) / 100,
      maxDurationMs: Math.round(durations[durations.length - 1] * 100) / 100,
      p95DurationMs: Math.round(durations[p95Index] * 100) / 100,
    };
  }

  public clear(): void {
    this.buffer.length = 0;
  }
}

export const tracer = PerformanceTracer.getInstance();
