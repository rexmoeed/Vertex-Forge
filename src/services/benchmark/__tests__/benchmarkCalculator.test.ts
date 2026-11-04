import { describe, it, expect } from 'vitest';
import { BenchmarkCalculator, BenchmarkTaskRecord } from '../benchmarkCalculator';

describe('BenchmarkCalculator & Swarm Performance', () => {
  it('returns default zeroed report for empty task records', () => {
    const report = BenchmarkCalculator.calculate([]);

    expect(report.totalTasks).toBe(0);
    expect(report.successRate).toBe(100);
    expect(report.tasksPerMinute).toBe(0);
    expect(report.speedupFactor).toBe(1.0);
  });

  it('calculates throughput, latency percentiles, and speedup correctly', () => {
    const sampleRecords: BenchmarkTaskRecord[] = [
      { taskId: '1', agentRole: 'Frontend', durationMs: 1000, tokensProcessed: 500, success: true, concurrencyLevel: 4 },
      { taskId: '2', agentRole: 'Backend', durationMs: 1200, tokensProcessed: 600, success: true, concurrencyLevel: 4 },
      { taskId: '3', agentRole: 'QA', durationMs: 800, tokensProcessed: 400, success: true, concurrencyLevel: 4 },
      { taskId: '4', agentRole: 'Security', durationMs: 1500, tokensProcessed: 700, success: false, concurrencyLevel: 4 },
    ];

    const report = BenchmarkCalculator.calculate(sampleRecords);

    expect(report.totalTasks).toBe(4);
    expect(report.successfulTasks).toBe(3);
    expect(report.failedTasks).toBe(1);
    expect(report.successRate).toBe(75);
    expect(report.avgLatencyMs).toBe(1125);
    expect(report.p95LatencyMs).toBe(1500);
    expect(report.tasksPerMinute).toBeGreaterThan(0);
    expect(report.speedupFactor).toBeGreaterThan(2.0); // 4 threads with 85% parallel fraction gives ~2.75x speedup
  });
});
