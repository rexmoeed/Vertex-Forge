import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceTracer, tracer } from '../performanceTracer';

describe('PerformanceTracer & Telemetry Metrics', () => {
  let customTracer: PerformanceTracer;

  beforeEach(() => {
    customTracer = new PerformanceTracer(10);
    tracer.clear();
  });

  it('measures span duration accurately with metadata', () => {
    const handle = customTracer.startSpan('ai_completion', 'ai', { model: 'gemini-2.5-pro' });
    const span = handle.end('ok');

    expect(span.name).toBe('ai_completion');
    expect(span.category).toBe('ai');
    expect(span.status).toBe('ok');
    expect(span.durationMs).toBeGreaterThanOrEqual(0);
    expect(span.metadata?.model).toBe('gemini-2.5-pro');

    const recorded = customTracer.getSpans('ai');
    expect(recorded.length).toBe(1);
    expect(recorded[0].id).toBe(span.id);
  });

  it('respects ring buffer capacity limits', () => {
    for (let i = 0; i < 15; i++) {
      customTracer.recordSpan({
        id: `span_${i}`,
        name: `task_${i}`,
        category: 'fs',
        startTimeMs: i * 10,
        durationMs: i * 5,
        status: 'ok',
      });
    }

    const spans = customTracer.getSpans();
    expect(spans.length).toBe(10);
    expect(spans[0].name).toBe('task_5');
    expect(spans[9].name).toBe('task_14');
  });

  it('calculates percentile and summary metrics correctly', () => {
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((duration, idx) => {
      customTracer.recordSpan({
        id: `s_${idx}`,
        name: 'render_cycle',
        category: 'render',
        startTimeMs: 0,
        durationMs: duration,
        status: 'ok',
      });
    });

    const summary = customTracer.getSummary('render');
    expect(summary.count).toBe(10);
    expect(summary.minDurationMs).toBe(10);
    expect(summary.maxDurationMs).toBe(100);
    expect(summary.avgDurationMs).toBe(55);
    expect(summary.p95DurationMs).toBe(100);
  });

  it('returns zeroed summary when no spans match', () => {
    const summary = customTracer.getSummary('network');
    expect(summary.count).toBe(0);
    expect(summary.totalDurationMs).toBe(0);
    expect(summary.avgDurationMs).toBe(0);
  });
});
