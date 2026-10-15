/**
 * Code Evolution Map typed contracts for Vertex Forge
 */

export interface EvolutionCommit {
  hash: string;
  shortHash: string;
  author: string;
  timestamp: number;
  message: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  affectedSymbols: string[];
  impact: 'low' | 'medium' | 'high';
  parentHashes: string[];
  diffSummary?: string;
}

export interface RenameEvent {
  oldPath: string;
  newPath: string;
  commitHash: string;
  timestamp: number;
}

export interface FileVersion {
  commitHash: string;
  timestamp: number;
  additions: number;
  deletions: number;
  author: string;
  message: string;
}

export interface FileEvolution {
  path: string;
  createdAt?: number;
  lastModifiedAt?: number;
  commitCount: number;
  authors: string[];
  additions: number;
  deletions: number;
  churn: number;
  renameHistory: RenameEvent[];
  versions: FileVersion[];
  hotspotScore: number;
}

export interface SymbolEvolution {
  symbolId: string;
  name: string;
  filePath: string;
  kind: string;
  history: Array<{
    timestamp: number;
    commitHash: string;
    changeType: 'created' | 'modified' | 'refactored' | 'signature_change' | 'deleted';
    description: string;
    author: string;
  }>;
}

export interface CodeHotspot {
  path: string;
  score: number;
  commitFrequency: number;
  churn: number;
  authorsCount: number;
  recentModifications: number;
  bugCorrelations: number;
  reasons: string[];
}

export interface ArchitectureEvolution {
  timestamp: number;
  commitHash: string;
  changeType: 'layer_added' | 'layer_removed' | 'module_added' | 'module_removed' | 'config_shift';
  summary: string;
  affectedPaths: string[];
}

export interface EvolutionStatistics {
  totalCommits: number;
  totalFiles: number;
  totalAuthors: number;
  activeBranches: number;
  weeklyChurn: number;
  hotspotsCount: number;
  firstCommitTimestamp: number;
  latestCommitTimestamp: number;
}

export interface CodeEvolutionMap {
  workspaceId: string;
  generatedAt: number;
  commits: EvolutionCommit[];
  files: FileEvolution[];
  symbols: SymbolEvolution[];
  hotspots: CodeHotspot[];
  architectureChanges: ArchitectureEvolution[];
  statistics: EvolutionStatistics;
}

export interface EvolutionAnalysisRequest {
  workspaceId: string;
  path?: string;
  symbolId?: string;
  branch?: string;
  fromDate?: number;
  toDate?: number;
  maxCommits?: number;
}

export interface FileHistoryRequest {
  workspaceId: string;
  filePath: string;
  maxCommits?: number;
}

export interface SymbolHistoryRequest {
  workspaceId: string;
  symbolName: string;
  filePath?: string;
}

export interface CommitImpact {
  hash: string;
  impactScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  affectedModules: string[];
  affectedPublicSymbols: string[];
  breakingChangesDetected: boolean;
}

export interface HotspotRequest {
  workspaceId: string;
  limit?: number;
  minCommits?: number;
}

export interface EvolutionComparison {
  fromCommit: string;
  toCommit: string;
  commitsBetween: number;
  filesChanged: string[];
  structuralShifts: string[];
  summary: string;
}

export interface RegressionInvestigationResult {
  likelyCommit?: EvolutionCommit;
  evidence: string[];
  confidence: number;
  changedFiles: string[];
  relevantDiff: string;
  explanation: string;
}

export interface CodeEvolutionService {
  analyze(request: EvolutionAnalysisRequest): Promise<CodeEvolutionMap>;
  getFileHistory(request: FileHistoryRequest): Promise<FileEvolution[]>;
  getSymbolHistory(request: SymbolHistoryRequest): Promise<SymbolEvolution[]>;
  getCommitImpact(commitHash: string): Promise<CommitImpact>;
  getHotspots(request: HotspotRequest): Promise<CodeHotspot[]>;
  compare(fromCommit: string, toCommit: string): Promise<EvolutionComparison>;
  investigateRegression(errorDescription: string, relevantFile?: string): Promise<RegressionInvestigationResult>;
}
