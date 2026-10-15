/**
 * Hierarchical Multi-Agent Architecture Contracts
 * Level 1: Main Orchestrator
 * Level 2: 10 Specialist Team Leads
 * Level 3: Focused Sub-Agents
 */

export type TeamLeadRole =
  | 'ProductDesignLead'
  | 'UIDesignLead'
  | 'FrontendLead'
  | 'BackendLead'
  | 'FullStackLead'
  | 'ArchitectureLead'
  | 'QALead'
  | 'SecurityLead'
  | 'DevOpsLead'
  | 'ResearchLead';

export type SubAgentRole =
  // Product Design
  | 'RequirementsAnalyst'
  | 'UserJourneyMapper'
  | 'FeatureScopeAnalyst'
  | 'AcceptanceCriteriaWriter'
  // UI/UX Design
  | 'WireframeDesigner'
  | 'VisualDesignAssistant'
  | 'DesignTokenSpecialist'
  | 'AccessibilityReviewer'
  // Frontend
  | 'ReactComponentBuilder'
  | 'CSSLayoutSpecialist'
  | 'StateManagementAssistant'
  | 'FormsValidationSpecialist'
  // Backend
  | 'APIEndpointBuilder'
  | 'DatabaseSchemaSpecialist'
  | 'AuthenticationSpecialist'
  | 'BusinessLogicImplementer'
  // Full-Stack
  | 'APIIntegrationAssistant'
  | 'DataFlowTracer'
  | 'EndToEndWorkflowSpecialist'
  // Architecture
  | 'DependencyMapper'
  | 'ModuleBoundaryReviewer'
  | 'TechnicalDebtAnalyst'
  // QA
  | 'UnitTestWriter'
  | 'IntegrationTestWriter'
  | 'BugReproductionAssistant'
  // Security
  | 'DependencySecurityReviewer'
  | 'AuthReviewer'
  | 'InputValidationReviewer'
  // DevOps
  | 'BuildConfigurationAssistant'
  | 'DeploymentAssistant'
  // Research
  | 'SymbolSearchAgent'
  | 'DependencyTracer'
  // Swarm & Autonomous Specialists
  | 'TypeLintSentry'
  | 'SecretLeakSniffer'
  | 'PerfLeakWatcher'
  | 'TestRunnerDiagnostician'
  | 'PatchSynthesizer'
  | 'DocSyncAgent'
  | 'EnvSyncAgent';

export type AgentExecutionState =
  | 'idle'
  | 'planning'
  | 'queued'
  | 'working'
  | 'waiting_dependency'
  | 'waiting_approval'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface FileReservation {
  filePath: string;
  subAgentId: string;
  parentLead: TeamLeadRole;
  acquiredAt: number;
  mode: 'exclusive_write' | 'read_only';
}

export interface SubAgentTaskContract {
  taskId: string;
  parentAgentId: TeamLeadRole;
  subAgentRole: SubAgentRole;
  title: string;
  objective: string;
  instructions: string;
  allowedTools: string[];
  workspaceScope: string;
  allowedFilePaths: string[];
  restrictedFilePaths: string[];
  dependencies: string[]; // task IDs that must complete first
  expectedDeliverables: string[];
  acceptanceCriteria: string[];
  permissionLevel: 'read' | 'write' | 'destructive_requires_approval';
  status: AgentExecutionState;
  progressPercent: number;
  outputSummary?: string;
  error?: string;
}

export interface CompletionReport {
  taskId: string;
  subAgentRole: SubAgentRole;
  workCompleted: string;
  filesInspected: string[];
  filesModified: string[];
  toolsUsed: string[];
  testsRun: string[];
  testResults: 'passed' | 'failed' | 'untested';
  knownLimitations: string[];
  approvedByLead: boolean;
  leadFeedback?: string;
  timestamp: string;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  taskId: string;
  type:
    | 'task_assignment'
    | 'context_request'
    | 'progress_update'
    | 'conflict_alert'
    | 'review_request'
    | 'revision_request'
    | 'completion_report';
  payload: any;
  timestamp: string;
}

export interface SpecialistLeadInfo {
  role: TeamLeadRole;
  title: string;
  shortName: string;
  icon: string;
  description: string;
  status: AgentExecutionState;
  currentTaskTitle?: string;
  assignedSubAgents: SubAgentRole[];
  qualityGatesPassed: number;
  activeReservations: string[];
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    surface: string;
    elevated: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontSans: string;
    fontMono: string;
    scale: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export interface ParallelSubAgentActiveInfo {
  taskId: string;
  subAgentRole: SubAgentRole;
  parentLead: TeamLeadRole;
  title: string;
  progress: number;
  stage: string;
}

export interface ParallelProgressInfo {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeParallelCount: number;
  percent: number;
  activeSubAgents: ParallelSubAgentActiveInfo[];
}

export type SwarmType =
  | 'feature-slicing'
  | 'background-guardians'
  | 'self-healing'
  | 'doc-env-sync';
export interface SwarmExecutionPlan {
  swarmId: string;
  type: SwarmType;
  title: string;
  tasks: SubAgentTaskContract[];
  status: AgentExecutionState;
  createdAt: number;
}

export interface GuardianStatus {
  isActive: boolean;
  typeSentry: { lastCheck: number; errorCount: number };
  secretSniffer: { lastCheck: number; clean: boolean; detectedCount: number };
  perfWatcher: { lastCheck: number; leaksFound: number };
}
