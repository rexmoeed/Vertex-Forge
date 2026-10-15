/**
 * Production Watchdog typed contracts for Vertex Forge
 */

export interface StackFrame {
  file: string;
  line: number;
  column: number;
  method?: string;
  inApp: boolean;
}

export interface StackTrace {
  frames: StackFrame[];
  raw: string;
}

export interface SourceMapping {
  resolvedFile: string;
  resolvedLine: number;
  resolvedColumn: number;
  sourceContext?: string[];
  mappingAvailable: boolean;
}

export interface IncidentEvidence {
  source: 'telemetry' | 'log' | 'trace' | 'stack-trace' | 'source' | 'git' | 'deployment' | 'test';
  description: string;
  reference?: string;
  verified: boolean;
}

export interface IncidentRootCause {
  description: string;
  file?: string;
  symbol?: string;
  line?: number;
  commit?: string;
  confidence: number;
  evidence: IncidentEvidence[];
}

export interface IncidentAnalysis {
  summary: string;
  rootCause: IncidentRootCause;
  suggestedFix: {
    description: string;
    filePath: string;
    patch: string;
    verificationTest: string;
  };
  regressionAnalysis?: {
    likelyCommit?: string;
    releaseCorrelation?: string;
    confidence: number;
  };
}

export interface ProductionIncident {
  id: string;
  providerId: string;
  title: string;
  environment: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  firstSeen: number;
  lastSeen: number;
  occurrenceCount: number;
  affectedUsers?: number;
  affectedVersions?: string[];
  status: 'new' | 'investigating' | 'known' | 'fix-proposed' | 'resolved';
  fingerprint: string;
  stackTrace?: StackTrace;
  sourceMapping?: SourceMapping;
  relatedCommits?: string[];
  analysis?: IncidentAnalysis;
}

export interface MonitoringConnectionResult {
  success: boolean;
  providerId: string;
  latencyMs?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface MonitoringProject {
  id: string;
  name: string;
  platform: string;
}

export interface MonitoringIssueRequest {
  projectId?: string;
  environment?: string;
  limit?: number;
  query?: string;
}

export interface MonitoringIssue {
  id: string;
  title: string;
  culprit?: string;
  level: 'error' | 'warning' | 'fatal';
  count: number;
  firstSeen: string;
  lastSeen: string;
  metadata?: Record<string, any>;
}

export interface MonitoringEvent {
  id: string;
  timestamp: string;
  message: string;
  tags?: Record<string, string>;
}

export interface MonitoringLogRequest {
  query?: string;
  sinceMinutes?: number;
  limit?: number;
}

export interface MonitoringLog {
  timestamp: number;
  level: string;
  message: string;
  service?: string;
}

export interface MonitoringTraceRequest {
  traceId?: string;
  service?: string;
}

export interface MonitoringTrace {
  traceId: string;
  spanCount: number;
  durationMs: number;
  hasErrors: boolean;
}

export interface MonitoringProvider {
  id: string;
  name: string;
  testConnection(): Promise<MonitoringConnectionResult>;
  listProjects(): Promise<MonitoringProject[]>;
  getIssues(request: MonitoringIssueRequest): Promise<MonitoringIssue[]>;
  getIssue(issueId: string): Promise<MonitoringIssue>;
  getEvents(issueId: string): Promise<MonitoringEvent[]>;
  getLogs(request: MonitoringLogRequest): Promise<MonitoringLog[]>;
  getTraces(request: MonitoringTraceRequest): Promise<MonitoringTrace[]>;
}

export interface WatchdogSchedule {
  enabled: boolean;
  intervalMinutes: number;
  environments: string[];
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
}

export interface ProductionWatchdogConfig {
  providerType: 'sentry' | 'opentelemetry' | 'datadog' | 'custom-http';
  endpoint: string;
  apiKeyCredentialId: string;
  organizationId?: string;
  projectId?: string;
  environment: 'production' | 'staging';
  readOnly: boolean;
  autoAnalyzeIncidents: boolean;
  redactSensitiveData: boolean;
}
