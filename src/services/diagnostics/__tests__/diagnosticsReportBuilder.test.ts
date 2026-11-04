import { describe, it, expect } from 'vitest';
import { DiagnosticsReportBuilder } from '../diagnosticsReportBuilder';

describe('DiagnosticsReportBuilder & Observability', () => {
  it('generates a healthy diagnostic report with system defaults', () => {
    const report = DiagnosticsReportBuilder.buildReport();

    expect(report.status).toBe('healthy');
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(report.memoryUsageMb).toBeGreaterThan(0);
    expect(report.timestamp).toBeDefined();
  });

  it('allows overriding specific metrics for custom health telemetry', () => {
    const report = DiagnosticsReportBuilder.buildReport({
      status: 'degraded',
      memoryUsageMb: 1500,
      cpuCores: 8,
    });

    expect(report.status).toBe('degraded');
    expect(report.memoryUsageMb).toBe(1500);
    expect(report.cpuCores).toBe(8);
  });

  it('formats diagnostic report into readable markdown summary', () => {
    const report = DiagnosticsReportBuilder.buildReport({
      status: 'healthy',
      uptimeSeconds: 3600,
      memoryUsageMb: 256,
      cpuCores: 16,
      platform: 'win32',
    });

    const markdown = DiagnosticsReportBuilder.formatMarkdown(report);

    expect(markdown).toContain('Vertex Forge Diagnostic Report');
    expect(markdown).toContain('HEALTHY');
    expect(markdown).toContain('3600s');
    expect(markdown).toContain('256 MB');
    expect(markdown).toContain('16 Cores');
  });
});
