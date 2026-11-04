/**
 * System Diagnostics Health Report Builder
 * Aggregates hardware capabilities, network status, storage health, and runtime metrics for observability.
 */

export interface SystemDiagnosticMetrics {
  status: 'healthy' | 'degraded' | 'critical';
  uptimeSeconds: number;
  memoryUsageMb: number;
  cpuCores: number;
  platform: string;
  storageQuotaMb?: number;
  storageUsedMb?: number;
  activeProcesses: number;
  timestamp: string;
}

export class DiagnosticsReportBuilder {
  public static buildReport(overrides?: Partial<SystemDiagnosticMetrics>): SystemDiagnosticMetrics {
    let memoryUsageMb = 128;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      memoryUsageMb = Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
    }

    let cpuCores = 4;
    let platform = 'browser';
    if (typeof navigator !== 'undefined') {
      cpuCores = navigator.hardwareConcurrency || 4;
      platform = navigator.platform || 'browser';
    } else if (typeof process !== 'undefined') {
      platform = process.platform || 'node';
    }

    const uptimeSeconds = typeof process !== 'undefined' && process.uptime ? Math.round(process.uptime()) : 0;

    let status: SystemDiagnosticMetrics['status'] = 'healthy';
    if (memoryUsageMb > 1024) {
      status = 'degraded';
    }
    if (memoryUsageMb > 2048) {
      status = 'critical';
    }

    return {
      status,
      uptimeSeconds,
      memoryUsageMb,
      cpuCores,
      platform,
      activeProcesses: 1,
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  public static formatMarkdown(report: SystemDiagnosticMetrics): string {
    return [
      `### 🩺 Vertex Forge Diagnostic Report`,
      `- **Status**: \`${report.status.toUpperCase()}\``,
      `- **Uptime**: ${report.uptimeSeconds}s`,
      `- **Heap Memory**: ${report.memoryUsageMb} MB`,
      `- **CPU Concurrency**: ${report.cpuCores} Cores`,
      `- **Platform**: ${report.platform}`,
      `- **Timestamp**: ${report.timestamp}`,
    ].join('\n');
  }
}
