/**
 * Bug Detective Cross-Layer Debugging Engine typed contracts for Vertex Forge
 */

import { EditorSelection, VerificationResult } from './projectIntelligence';

export interface ErrorEvidence {
  message: string;
  stack?: string;
  source?: 'terminal' | 'console' | 'network' | 'backend' | 'test' | 'database';
  line?: number;
  column?: number;
  filePath?: string;
  statusCode?: number;
}

export interface LogEvidence {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

export interface BugInvestigationRequest {
  workspaceId: string;
  description: string;
  error?: ErrorEvidence;
  activeFile?: string;
  selection?: EditorSelection;
  terminalSessionId?: string;
  logs?: LogEvidence[];
  environment: 'development' | 'test' | 'staging' | 'production';
}

export interface BugEvidence {
  id: string;
  type: 'code_pattern' | 'stack_frame' | 'network_mismatch' | 'schema_conflict' | 'git_regression' | 'runtime_log';
  layer: 'ui' | 'state' | 'client' | 'network' | 'api' | 'backend' | 'service' | 'database' | 'external-service';
  description: string;
  filePath?: string;
  lineNumber?: number;
  snippet?: string;
  confidence: number;
}

export interface BugTraceStep {
  layer:
    | 'ui'
    | 'state'
    | 'client'
    | 'network'
    | 'api'
    | 'backend'
    | 'service'
    | 'database'
    | 'external-service';
  file?: string;
  symbol?: string;
  line?: number;
  description: string;
  evidence: BugEvidence[];
  confidence: number;
  presentInProject: boolean;
}

export interface BugHypothesis {
  id: string;
  title: string;
  layer: string;
  explanation: string;
  confidence: number;
  tested: boolean;
  status: 'active' | 'confirmed' | 'refuted';
}

export interface RootCause {
  description: string;
  file?: string;
  symbol?: string;
  line?: number;
  evidence: BugEvidence[];
  confidence: number;
}

export interface ProposedFix {
  id: string;
  title: string;
  filePath: string;
  originalSnippet: string;
  patchedSnippet: string;
  explanation: string;
  verificationCommand: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BugInvestigation {
  id: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'root-cause-found' | 'fix-proposed' | 'fixed' | 'blocked';
  hypothesis: BugHypothesis[];
  trace: BugTraceStep[];
  evidence: BugEvidence[];
  affectedFiles: string[];
  rootCause?: RootCause;
  proposedFixes: ProposedFix[];
  verification?: VerificationResult;
  regressionCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface BugDetective {
  investigate(request: BugInvestigationRequest): Promise<BugInvestigation>;
  continue(investigationId: string, message: string): Promise<BugInvestigation>;
  applyFix(investigationId: string, fixId: string): Promise<{ success: boolean; error?: string }>;
  cancel(investigationId: string): Promise<void>;
}
