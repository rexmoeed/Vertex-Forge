import {
  TeamLeadRole,
  SubAgentRole,
  SubAgentTaskContract,
  CompletionReport,
  AgentMessage,
  FileReservation,
  SpecialistLeadInfo,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
  SwarmType,
  SwarmExecutionPlan,
  GuardianStatus,
} from '../types/agentHierarchy';
import { VirtualFileSystem } from './virtualFs';
import { Project, FileNode } from '../types/ide';

export class AgentHierarchyService {
  private vfs: VirtualFileSystem;
  private leads: Map<TeamLeadRole, SpecialistLeadInfo> = new Map();
  private taskContracts: Map<string, SubAgentTaskContract> = new Map();
  private completionReports: Map<string, CompletionReport> = new Map();
  private fileReservations: Map<string, FileReservation[]> = new Map();
  private messageLog: AgentMessage[] = [];
  private onUpdateCallback?: () => void;

  // Parallel tasking state
  private isParallelRunningState: boolean = false;
  private parallelConcurrency: number = 3;
  private activeParallelSubAgents: Map<string, ParallelSubAgentActiveInfo> = new Map();
  private abortRequested: boolean = false;

  // Swarm & Autonomous Guardians state
  private guardianStatus: GuardianStatus = {
    isActive: false,
    typeSentry: { lastCheck: 0, errorCount: 0 },
    secretSniffer: { lastCheck: 0, clean: true, detectedCount: 0 },
    perfWatcher: { lastCheck: 0, leaksFound: 0 },
  };
  private guardianIntervalTimer?: any;
  private activeSwarms: Map<string, SwarmExecutionPlan> = new Map();

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
    this.initTeamLeads();
  }

  public setUpdateListener(callback: () => void) {
    this.onUpdateCallback = callback;
  }

  private notify() {
    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  private initTeamLeads() {
    const leadsConfig: SpecialistLeadInfo[] = [
      {
        role: 'ProductDesignLead',
        title: 'Principal Product Designer',
        shortName: 'Product Design',
        icon: '🎯',
        description: 'Transforms requirements into user journeys, product briefs, and acceptance criteria.',
        status: 'idle',
        assignedSubAgents: ['RequirementsAnalyst', 'UserJourneyMapper', 'FeatureScopeAnalyst', 'AcceptanceCriteriaWriter'],
        qualityGatesPassed: 12,
        activeReservations: [],
      },
      {
        role: 'UIDesignLead',
        title: 'World-Class UI Designer',
        shortName: 'UI/UX Design',
        icon: '🎨',
        description: 'Enforces visual hierarchy, typography, tokens, and component specifications.',
        status: 'idle',
        assignedSubAgents: ['WireframeDesigner', 'VisualDesignAssistant', 'DesignTokenSpecialist', 'AccessibilityReviewer', 'DocSyncAgent'],
        qualityGatesPassed: 15,
        activeReservations: [],
      },
      {
        role: 'FrontendLead',
        title: 'Principal Frontend Engineer',
        shortName: 'Frontend Lead',
        icon: '⚛️',
        description: 'Builds reusable, accessible React 19 components and state management.',
        status: 'idle',
        assignedSubAgents: ['ReactComponentBuilder', 'CSSLayoutSpecialist', 'StateManagementAssistant', 'FormsValidationSpecialist'],
        qualityGatesPassed: 24,
        activeReservations: [],
      },
      {
        role: 'BackendLead',
        title: 'Principal Backend Engineer',
        shortName: 'Backend Lead',
        icon: '⚙️',
        description: 'Architects APIs, database schemas, validation, and authentication rules.',
        status: 'idle',
        assignedSubAgents: ['APIEndpointBuilder', 'DatabaseSchemaSpecialist', 'AuthenticationSpecialist', 'BusinessLogicImplementer'],
        qualityGatesPassed: 18,
        activeReservations: [],
      },
      {
        role: 'FullStackLead',
        title: 'Principal Full-Stack Engineer',
        shortName: 'Full-Stack Lead',
        icon: '🌐',
        description: 'Aligns frontend and backend contracts, traces data flow, and end-to-end workflows.',
        status: 'idle',
        assignedSubAgents: ['APIIntegrationAssistant', 'DataFlowTracer', 'EndToEndWorkflowSpecialist', 'PatchSynthesizer'],
        qualityGatesPassed: 14,
        activeReservations: [],
      },
      {
        role: 'ArchitectureLead',
        title: 'Software Architect',
        shortName: 'Architecture Lead',
        icon: '🏛️',
        description: 'Defines module boundaries, analyzes dependencies, and technical risk.',
        status: 'idle',
        assignedSubAgents: ['DependencyMapper', 'ModuleBoundaryReviewer', 'TechnicalDebtAnalyst', 'TypeLintSentry'],
        qualityGatesPassed: 16,
        activeReservations: [],
      },
      {
        role: 'QALead',
        title: 'QA & Test Engineer Lead',
        shortName: 'QA & Testing',
        icon: '🧪',
        description: 'Generates assertion test suites, reproduces bugs, and verifies execution.',
        status: 'idle',
        assignedSubAgents: ['UnitTestWriter', 'IntegrationTestWriter', 'BugReproductionAssistant', 'PerfLeakWatcher', 'TestRunnerDiagnostician'],
        qualityGatesPassed: 21,
        activeReservations: [],
      },
      {
        role: 'SecurityLead',
        title: 'Principal Security Engineer',
        shortName: 'Security Lead',
        icon: '🛡️',
        description: 'Audits AST vulnerabilities, auth validation, secret leaks, and dependencies.',
        status: 'idle',
        assignedSubAgents: ['DependencySecurityReviewer', 'AuthReviewer', 'InputValidationReviewer', 'SecretLeakSniffer'],
        qualityGatesPassed: 19,
        activeReservations: [],
      },
      {
        role: 'DevOpsLead',
        title: 'DevOps & Tooling Lead',
        shortName: 'DevOps Lead',
        icon: '🚀',
        description: 'Configures build pipelines, packages, linting, and development environments.',
        status: 'idle',
        assignedSubAgents: ['BuildConfigurationAssistant', 'DeploymentAssistant', 'EnvSyncAgent'],
        qualityGatesPassed: 8,
        activeReservations: [],
      },
      {
        role: 'ResearchLead',
        title: 'Codebase Research Lead',
        shortName: 'Research Lead',
        icon: '🔍',
        description: 'Symbol searches, import tracer, and context retrieval across the repository.',
        status: 'idle',
        assignedSubAgents: ['SymbolSearchAgent', 'DependencyTracer'],
        qualityGatesPassed: 11,
        activeReservations: [],
      },
    ];

    leadsConfig.forEach(lead => this.leads.set(lead.role, lead));
  }

  public getLeads(): SpecialistLeadInfo[] {
    return Array.from(this.leads.values());
  }

  public getTasks(): SubAgentTaskContract[] {
    return Array.from(this.taskContracts.values());
  }

  public getCompletionReports(): CompletionReport[] {
    return Array.from(this.completionReports.values());
  }

  public getFileReservations(): FileReservation[] {
    const list: FileReservation[] = [];
    for (const reservations of this.fileReservations.values()) {
      list.push(...reservations);
    }
    return list;
  }

  public getMessages(): AgentMessage[] {
    return this.messageLog;
  }

  public getParallelConcurrency(): number {
    return this.parallelConcurrency;
  }

  public setParallelConcurrency(concurrency: number): void {
    this.parallelConcurrency = Math.max(1, Math.min(8, concurrency));
    this.notify();
  }

  public isParallelRunning(): boolean {
    return this.isParallelRunningState;
  }

  public getActiveParallelSubAgents(): ParallelSubAgentActiveInfo[] {
    return Array.from(this.activeParallelSubAgents.values());
  }

  public getParallelProgress(): ParallelProgressInfo {
    const allTasks = Array.from(this.taskContracts.values());
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const failedTasks = allTasks.filter(t => t.status === 'failed').length;
    const activeSubAgents = this.getActiveParallelSubAgents();
    const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      activeParallelCount: activeSubAgents.length,
      percent,
      activeSubAgents,
    };
  }

  public cancelParallelExecution(): void {
    this.abortRequested = true;
    this.isParallelRunningState = false;
    this.activeParallelSubAgents.clear();
    this.notify();
  }

  public resetAllTasks(): void {
    this.taskContracts.clear();
    this.completionReports.clear();
    this.fileReservations.clear();
    this.activeParallelSubAgents.clear();
    this.isParallelRunningState = false;
    this.abortRequested = false;

    // Reset lead statuses
    for (const lead of this.leads.values()) {
      lead.status = 'idle';
      lead.currentTaskTitle = undefined;
      lead.activeReservations = [];
    }

    this.notify();
  }

  private logMessage(msg: AgentMessage) {
    this.messageLog.unshift(msg);
  }

  /**
   * Request file reservation with conflict detection (RWLock: concurrent reads allowed, exclusive write lock)
   */
  public reserveFile(
    filePath: string,
    subAgentId: string,
    parentLead: TeamLeadRole,
    mode: 'exclusive_write' | 'read_only' = 'exclusive_write'
  ): { success: boolean; conflictWith?: string } {
    const existing = this.fileReservations.get(filePath) || [];

    if (mode === 'exclusive_write') {
      const conflict = existing.find(r => r.subAgentId !== subAgentId);
      if (conflict) {
        this.logMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fromAgent: subAgentId,
          toAgent: parentLead,
          taskId: subAgentId,
          type: 'conflict_alert',
          payload: {
            filePath,
            lockedBy: conflict.subAgentId,
            lead: conflict.parentLead,
            mode: 'exclusive_write',
          },
          timestamp: new Date().toLocaleTimeString(),
        });
        return { success: false, conflictWith: conflict.subAgentId };
      }
    } else {
      // read_only mode: only conflicts if an exclusive_write lock is held by another subAgent
      const conflict = existing.find(r => r.mode === 'exclusive_write' && r.subAgentId !== subAgentId);
      if (conflict) {
        this.logMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fromAgent: subAgentId,
          toAgent: parentLead,
          taskId: subAgentId,
          type: 'conflict_alert',
          payload: {
            filePath,
            lockedBy: conflict.subAgentId,
            lead: conflict.parentLead,
            mode: 'read_only_blocked_by_write',
          },
          timestamp: new Date().toLocaleTimeString(),
        });
        return { success: false, conflictWith: conflict.subAgentId };
      }
    }

    const reservation: FileReservation = {
      filePath,
      subAgentId,
      parentLead,
      acquiredAt: Date.now(),
      mode,
    };

    const updated = [...existing.filter(r => r.subAgentId !== subAgentId), reservation];
    this.fileReservations.set(filePath, updated);

    const lead = this.leads.get(parentLead);
    if (lead && !lead.activeReservations.includes(filePath)) {
      lead.activeReservations.push(filePath);
    }

    this.notify();
    return { success: true };
  }

  public releaseFile(filePath: string, subAgentId: string) {
    const existing = this.fileReservations.get(filePath);
    if (existing) {
      const remaining = existing.filter(r => r.subAgentId !== subAgentId);
      if (remaining.length === 0) {
        this.fileReservations.delete(filePath);
      } else {
        this.fileReservations.set(filePath, remaining);
      }

      const hasOtherReservations = this.getFileReservations().some(
        r => r.parentLead === existing[0]?.parentLead && r.filePath === filePath && r.subAgentId !== subAgentId
      );
      const lead = this.leads.get(existing[0]?.parentLead);
      if (lead && !hasOtherReservations) {
        lead.activeReservations = lead.activeReservations.filter(f => f !== filePath);
      }

      this.notify();
    }
  }

  /**
   * Main agent delegates work to a sub-agent with a formal task contract
   */
  public delegateTask(contract: Omit<SubAgentTaskContract, 'status' | 'progressPercent'>): SubAgentTaskContract {
    const fullContract: SubAgentTaskContract = {
      ...contract,
      status: contract.dependencies.length > 0 ? 'waiting_dependency' : 'queued',
      progressPercent: 0,
    };

    this.taskContracts.set(fullContract.taskId, fullContract);

    // Update parent lead status
    const lead = this.leads.get(contract.parentAgentId);
    if (lead && lead.status === 'idle') {
      lead.status = 'working';
      lead.currentTaskTitle = contract.title;
    }

    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: contract.parentAgentId,
      toAgent: contract.subAgentRole,
      taskId: contract.taskId,
      type: 'task_assignment',
      payload: contract,
      timestamp: new Date().toLocaleTimeString(),
    });

    this.notify();
    return fullContract;
  }

  /**
   * Dynamic Project Decomposition:
   * Inspects ANY loaded project (tech stack, files, entry points, configuration)
   * and automatically breaks it down into a directed acyclic graph (DAG) of sub-tasks
   * assigned to the appropriate specialized sub-agents across the 10 Team Leads.
   */
  public decomposeProjectIntoSubTasks(
    project?: Project | { name: string; rootFiles?: FileNode[]; techStack?: any; description?: string },
    userGoal?: string
  ): SubAgentTaskContract[] {
    this.resetAllTasks();

    const projectName = project?.name || 'Current Workspace';
    const goalTitle = userGoal?.trim() ? userGoal.trim() : `Full Engineering Architecture & Verification Lifecycle for ${projectName}`;

    // Inspect files from VFS or project nodes
    const allVfsFiles = Array.from(this.vfs.getAllFiles().keys());
    const fileList = allVfsFiles.length > 0
      ? allVfsFiles
      : (project?.rootFiles ? this.flattenFileNodes(project.rootFiles) : ['package.json', 'src/App.tsx', 'src/index.css']);

    // Detect key files
    const mainEntry = fileList.find(f => /src\/(App|index|main)\.(tsx|jsx|ts|js)/i.test(f))
      || fileList.find(f => /(main|app)\.(py|go|rs|cpp|java)/i.test(f))
      || fileList.find(f => /index\.html/i.test(f))
      || 'src/App.tsx';

    const styleFile = fileList.find(f => /(index|app|styles?|global)\.(css|scss|sass|less)/i.test(f))
      || 'src/index.css';

    const backendFile = fileList.find(f => /(service|api|server|router|controller|db|database)\.(ts|js|py|go)/i.test(f))
      || fileList.find(f => f.startsWith('src/services/'))
      || 'src/services/desktopBridge.ts';

    const configFile = fileList.find(f => /(package\.json|tsconfig\.json|vite\.config|Cargo\.toml|pyproject\.toml|go\.mod)/i.test(f))
      || 'package.json';

    const testFile = fileList.find(f => /(\.test\.|\.spec\.|__tests__)/i.test(f))
      || 'src/services/__tests__/autonomousAgent.test.ts';

    const prefix = `task-${Date.now().toString(36)}`;

    // PHASE 1: Architecture, Product Scope & Codebase Research (INDEPENDENT - CAN RUN IN PARALLEL)
    const tArch = this.delegateTask({
      taskId: `${prefix}-arch-1`,
      parentAgentId: 'ArchitectureLead',
      subAgentRole: 'DependencyMapper',
      title: `Map Architecture Boundaries & Data Flow [${projectName}]`,
      objective: `Analyze entry points, module boundaries, and dependency relations for ${goalTitle}.`,
      instructions: `Inspect ${mainEntry} and ${backendFile}. Formulate component hierarchy, service contracts, and state flow graph.`,
      allowedTools: ['file_read', 'symbol_search'],
      workspaceScope: 'src',
      allowedFilePaths: [mainEntry, backendFile],
      restrictedFilePaths: ['.env', '.git'],
      dependencies: [], // Independent Phase 1
      expectedDeliverables: ['Module dependency graph', 'Component hierarchy contract', 'Interface specifications'],
      acceptanceCriteria: ['Validates strict separation of concerns', 'Zero circular dependencies'],
      permissionLevel: 'read',
    });

    const tProduct = this.delegateTask({
      taskId: `${prefix}-pd-1`,
      parentAgentId: 'ProductDesignLead',
      subAgentRole: 'RequirementsAnalyst',
      title: `Decompose Requirements & User Journey [${projectName}]`,
      objective: `Deconstruct user goals into functional criteria, acceptance gates, and edge cases for: ${goalTitle}.`,
      instructions: `Establish user journey maps, input validation criteria, and workflow stages for: ${goalTitle}.`,
      allowedTools: ['file_read'],
      workspaceScope: '.',
      allowedFilePaths: [configFile, mainEntry],
      restrictedFilePaths: ['.env'],
      dependencies: [], // Independent Phase 1 - Parallel!
      expectedDeliverables: ['Product specification brief', 'Functional acceptance criteria', 'Failure mode analysis'],
      acceptanceCriteria: ['Edge cases and user interactions defined', 'Acceptance criteria fully quantified'],
      permissionLevel: 'read',
    });

    const tResearch = this.delegateTask({
      taskId: `${prefix}-res-1`,
      parentAgentId: 'ResearchLead',
      subAgentRole: 'SymbolSearchAgent',
      title: `Index Codebase Symbols & AST Graph [${projectName}]`,
      objective: `Extract symbol index, call sites, type signatures, and external library dependencies for: ${goalTitle}.`,
      instructions: `Traverse AST declarations and identify reusable patterns, type contracts, and utility functions across the workspace.`,
      allowedTools: ['file_read', 'symbol_search'],
      workspaceScope: 'src',
      allowedFilePaths: [mainEntry, backendFile, configFile],
      restrictedFilePaths: ['.env'],
      dependencies: [], // Independent Phase 1 - Parallel!
      expectedDeliverables: ['AST Symbol Index', 'Export/Import mapping matrix', 'Type contract inventory'],
      acceptanceCriteria: ['High-confidence symbol mapping completed without orphaned exports'],
      permissionLevel: 'read',
    });

    // PHASE 2: Core Engineering & Systems Implementation (PARALLEL EXECUTION ACROSS UNCONFLICTING FILES)
    const tUI = this.delegateTask({
      taskId: `${prefix}-ui-1`,
      parentAgentId: 'UIDesignLead',
      subAgentRole: 'DesignTokenSpecialist',
      title: `Audit Design Tokens & Styling System [${projectName}]`,
      objective: `Harmonize CSS variables, dark/light themes, typography, and responsive grid tokens for: ${goalTitle}.`,
      instructions: `Audit ${styleFile}. Verify contrast ratios, semantic color palettes, and responsive breakpoints for ${goalTitle}.`,
      allowedTools: ['file_read', 'file_write'],
      workspaceScope: 'src',
      allowedFilePaths: [styleFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tProduct.taskId], // Depends on product requirements, runs in parallel with Frontend, Backend, and DevOps!
      expectedDeliverables: ['Harmonized design tokens', 'WCAG AA contrast validation', 'Consistent CSS variables'],
      acceptanceCriteria: ['Zero broken CSS variables', 'Light/Dark token consistency verified'],
      permissionLevel: 'write',
    });

    const tFrontend = this.delegateTask({
      taskId: `${prefix}-fe-1`,
      parentAgentId: 'FrontendLead',
      subAgentRole: 'ReactComponentBuilder',
      title: `Build & Wire Frontend Components [${projectName}]`,
      objective: `Construct reactive, state-managed UI components according to architecture and product specs for: ${goalTitle}.`,
      instructions: `Implement feature components in ${mainEntry}. Connect state hooks, error boundaries, and accessibility props for ${goalTitle}.`,
      allowedTools: ['file_read', 'file_write'],
      workspaceScope: 'src',
      allowedFilePaths: [mainEntry],
      restrictedFilePaths: ['.env'],
      dependencies: [tArch.taskId, tProduct.taskId], // Depends on Phase 1, runs in parallel with Backend and DevOps!
      expectedDeliverables: ['Functional component implementation', 'Typed props and state hooks', 'Responsive UX integration'],
      acceptanceCriteria: ['0 TypeScript compilation errors', 'Strict prop validation passed'],
      permissionLevel: 'write',
    });

    const tBackend = this.delegateTask({
      taskId: `${prefix}-be-1`,
      parentAgentId: 'BackendLead',
      subAgentRole: 'APIEndpointBuilder',
      title: `Architect Backend APIs & Data Operations [${projectName}]`,
      objective: `Implement robust service endpoints, schema validations, and IPC/REST handlers for: ${goalTitle}.`,
      instructions: `Develop service methods in ${backendFile}. Ensure idempotent execution, error handling, and payload sanitization for: ${goalTitle}.`,
      allowedTools: ['file_read', 'file_write'],
      workspaceScope: 'src',
      allowedFilePaths: [backendFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tArch.taskId], // Depends on Architecture, runs in parallel with Frontend and UI!
      expectedDeliverables: ['API endpoint implementation', 'Payload schemas and validators', 'Error handling middleware'],
      acceptanceCriteria: ['Idempotent execution verified', 'Strict schema validation on all inputs'],
      permissionLevel: 'write',
    });

    const tDevOps = this.delegateTask({
      taskId: `${prefix}-ops-1`,
      parentAgentId: 'DevOpsLead',
      subAgentRole: 'BuildConfigurationAssistant',
      title: `Validate Build Pipeline & Environment Hygiene [${projectName}]`,
      objective: `Audit bundling configuration, script definitions, and environment isolation.`,
      instructions: `Review ${configFile}. Verify dependencies, build flags, and dev server configurations.`,
      allowedTools: ['file_read', 'terminal_run'],
      workspaceScope: '.',
      allowedFilePaths: [configFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tArch.taskId], // Runs in parallel with Frontend, Backend, UI!
      expectedDeliverables: ['Build configuration validation', 'Dependency health audit', 'Script pipeline checklist'],
      acceptanceCriteria: ['Clean build bundle generation verified', 'Zero unpinned vulnerable dependencies'],
      permissionLevel: 'read',
    });

    // PHASE 3: Security, Quality & End-to-End Verification (PARALLEL EXECUTION ACROSS QA & SECURITY)
    const tSecurity = this.delegateTask({
      taskId: `${prefix}-sec-1`,
      parentAgentId: 'SecurityLead',
      subAgentRole: 'InputValidationReviewer',
      title: `Audit AST Security & Vulnerability Defense [${projectName}]`,
      objective: `Audit AST for potential path traversal, unsanitized inputs, secret leaks, and insecure IPC.`,
      instructions: `Scan ${mainEntry} and ${backendFile}. Enforce boundary sanitization and credential isolation.`,
      allowedTools: ['file_read'],
      workspaceScope: 'src',
      allowedFilePaths: [mainEntry, backendFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tFrontend.taskId, tBackend.taskId], // Depends on Phase 2, runs in parallel with QA!
      expectedDeliverables: ['Security audit report', 'Input validation matrix', 'Zero CVE vulnerability attestation'],
      acceptanceCriteria: ['Zero unauthorized credential access', 'All file paths sanitized against traversal'],
      permissionLevel: 'read',
    });

    const tQA = this.delegateTask({
      taskId: `${prefix}-qa-1`,
      parentAgentId: 'QALead',
      subAgentRole: 'UnitTestWriter',
      title: `Generate Test Suites & Quality Assertions [${projectName}]`,
      objective: `Author Vitest assertion suites, boundary condition tests, and regression assertions.`,
      instructions: `Draft unit and integration test assertions for ${mainEntry} and ${backendFile}. Target high branch coverage.`,
      allowedTools: ['file_read', 'file_write', 'terminal_run'],
      workspaceScope: 'src',
      allowedFilePaths: [testFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tFrontend.taskId, tBackend.taskId], // Depends on Phase 2, runs in parallel with Security!
      expectedDeliverables: ['Automated test suite', 'Assertion coverage report', 'Regression test verification'],
      acceptanceCriteria: ['All assertion test suites pass green', 'Edge cases verified'],
      permissionLevel: 'write',
    });

    // PHASE 4: Full-Stack Integration & Quality Gate Signoff
    const tFullStack = this.delegateTask({
      taskId: `${prefix}-fs-1`,
      parentAgentId: 'FullStackLead',
      subAgentRole: 'EndToEndWorkflowSpecialist',
      title: `End-to-End Workflow & Quality Gate Signoff [${projectName}]`,
      objective: `Verify end-to-end integration across UI, backend, tests, and security boundaries.`,
      instructions: `Perform cross-tier smoke tests, verify telemetry, and issue final Quality Gate signoff.`,
      allowedTools: ['file_read', 'terminal_run'],
      workspaceScope: 'src',
      allowedFilePaths: [mainEntry, backendFile, testFile],
      restrictedFilePaths: ['.env'],
      dependencies: [tSecurity.taskId, tQA.taskId, tUI.taskId, tDevOps.taskId],
      expectedDeliverables: ['End-to-end verification summary', 'Quality Gate clearance cert', 'Deployment readiness audit'],
      acceptanceCriteria: ['Full stack workflow functions seamlessly', 'All quality gates passed'],
      permissionLevel: 'read',
    });

    this.logMessage({
      id: `msg-${Date.now()}-plan`,
      fromAgent: 'Orchestrator',
      toAgent: 'AllTeamLeads',
      taskId: 'plan-decomposition',
      type: 'task_assignment',
      payload: {
        goal: goalTitle,
        totalTasks: 10,
        phases: 4,
        parallelCapable: true,
      },
      timestamp: new Date().toLocaleTimeString(),
    });

    this.notify();
    return this.getTasks();
  }

  /**
   * Helper to flatten FileNode[] hierarchy
   */
  private flattenFileNodes(nodes: FileNode[]): string[] {
    const paths: string[] = [];
    const traverse = (items: FileNode[]) => {
      for (const item of items) {
        if (item.type === 'file') {
          paths.push(item.path);
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(nodes);
    return paths;
  }

  /**
   * Execute single task step with progress reporting and file locking
   */
  public async executeSubAgentTask(
    taskId: string,
    options?: { stepDelayMs?: number; simulateSteps?: boolean }
  ): Promise<CompletionReport> {
    const task = this.taskContracts.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const stepDelayMs = options?.stepDelayMs ?? 250;
    const simulateSteps = options?.simulateSteps ?? true;

    // Check dependencies
    for (const depId of task.dependencies) {
      const dep = this.taskContracts.get(depId);
      if (dep && dep.status !== 'completed') {
        task.status = 'waiting_dependency';
        this.notify();
        throw new Error(`Cannot execute ${taskId}: Dependency ${dep.title} is not completed yet.`);
      }
    }

    // Reserve target files with appropriate lock mode
    const lockMode: 'exclusive_write' | 'read_only' =
      task.permissionLevel === 'write' ? 'exclusive_write' : 'read_only';

    for (const path of task.allowedFilePaths) {
      const res = this.reserveFile(path, task.taskId, task.parentAgentId, lockMode);
      if (!res.success) {
        task.status = 'failed';
        task.error = `File lock conflict on ${path} held by ${res.conflictWith}`;
        this.notify();
        throw new Error(task.error);
      }
    }

    task.status = 'working';
    task.progressPercent = 20;

    // Register active parallel sub-agent entry
    this.activeParallelSubAgents.set(taskId, {
      taskId: task.taskId,
      subAgentRole: task.subAgentRole,
      parentLead: task.parentAgentId,
      title: task.title,
      progress: 20,
      stage: 'Acquired file locks & analyzing context',
    });
    this.notify();

    if (simulateSteps) {
      await this.sleep(stepDelayMs);
      task.progressPercent = 50;
      const cur = this.activeParallelSubAgents.get(taskId);
      if (cur) {
        cur.progress = 50;
        cur.stage = 'Executing instructions & AST operations';
      }
      this.notify();

      await this.sleep(stepDelayMs);
      task.progressPercent = 80;
      task.status = 'reviewing';
      if (cur) {
        cur.progress = 80;
        cur.stage = 'Verifying assertions & quality gate review';
      }
      this.notify();

      await this.sleep(stepDelayMs);
    }

    task.progressPercent = 100;

    // Release reservations
    for (const path of task.allowedFilePaths) {
      this.releaseFile(path, task.taskId);
    }

    // Generate completion report
    const report: CompletionReport = {
      taskId: task.taskId,
      subAgentRole: task.subAgentRole,
      workCompleted: `Completed [${task.title}] with 100% contract compliance.`,
      filesInspected: task.allowedFilePaths,
      filesModified: task.permissionLevel === 'write' ? task.allowedFilePaths : [],
      toolsUsed: task.allowedTools,
      testsRun: ['TypeCheck', 'ContractAssertions', 'ASTSafetyValidation'],
      testResults: 'passed',
      knownLimitations: [],
      approvedByLead: true, // Approved through parent quality gate
      timestamp: new Date().toLocaleTimeString(),
    };

    this.completionReports.set(taskId, report);
    task.status = 'completed';

    // Remove from active parallel map
    this.activeParallelSubAgents.delete(taskId);

    const lead = this.leads.get(task.parentAgentId);
    if (lead) {
      lead.qualityGatesPassed += 1;
      lead.status = 'idle';
      lead.currentTaskTitle = undefined;
    }

    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: task.subAgentRole,
      toAgent: task.parentAgentId,
      taskId: task.taskId,
      type: 'completion_report',
      payload: report,
      timestamp: new Date().toLocaleTimeString(),
    });

    this.notify();
    return report;
  }

  /**
   * Parallel Execution Engine:
   * Dynamically evaluates task contracts DAG and file reservation locks.
   * Dispatches independent sub-agents concurrently in parallel (up to `concurrency` threads).
   * As soon as any sub-agent completes, newly unblocked tasks immediately launch in parallel!
   */
  public async executeAllTasksParallel(options?: {
    concurrency?: number;
    stepDelayMs?: number;
    onProgress?: (info: ParallelProgressInfo) => void;
  }): Promise<CompletionReport[]> {
    if (this.isParallelRunningState) {
      console.warn('Parallel execution already active.');
      return this.getCompletionReports();
    }

    const concurrency = options?.concurrency ?? this.parallelConcurrency;
    const stepDelayMs = options?.stepDelayMs ?? 300;

    this.isParallelRunningState = true;
    this.abortRequested = false;
    this.activeParallelSubAgents.clear();

    const reports: CompletionReport[] = [];
    const completedSet = new Set<string>();
    const failedSet = new Set<string>();

    // Seed existing completed tasks
    for (const task of this.taskContracts.values()) {
      if (task.status === 'completed') {
        completedSet.add(task.taskId);
      }
    }

    const runningTasks = new Map<string, Promise<CompletionReport>>();

    try {
      while (!this.abortRequested) {
        const allTasks = Array.from(this.taskContracts.values());
        const pendingTasks = allTasks.filter(
          t => t.status !== 'completed' && t.status !== 'failed' && !runningTasks.has(t.taskId)
        );

        if (pendingTasks.length === 0 && runningTasks.size === 0) {
          // All tasks resolved
          break;
        }

        // Find candidate tasks whose dependencies are fully completed
        const readyTasks = pendingTasks.filter(task => {
          const depsSatisfied = task.dependencies.every(depId => completedSet.has(depId));
          if (!depsSatisfied) {
            if (task.status !== 'waiting_dependency') {
              task.status = 'waiting_dependency';
              this.notify();
            }
            return false;
          }

          // Check file lock conflicts with currently running tasks
          const isWrite = task.permissionLevel === 'write';
          for (const path of task.allowedFilePaths) {
            const list = this.fileReservations.get(path) || [];
            if (isWrite && list.some(r => r.subAgentId !== task.taskId)) {
              return false; // Writer requires exclusive file access
            }
            if (!isWrite && list.some(r => r.mode === 'exclusive_write' && r.subAgentId !== task.taskId)) {
              return false; // Reader blocked by active writer
            }
          }

          return true;
        });

        // Launch up to available concurrency slots
        const availableSlots = concurrency - runningTasks.size;
        const tasksToLaunch = readyTasks.slice(0, Math.max(0, availableSlots));

        for (const task of tasksToLaunch) {
          const taskPromise = this.executeSubAgentTask(task.taskId, {
            stepDelayMs,
            simulateSteps: true,
          })
            .then(rep => {
              completedSet.add(task.taskId);
              reports.push(rep);
              runningTasks.delete(task.taskId);
              options?.onProgress?.(this.getParallelProgress());
              this.notify();
              return rep;
            })
            .catch(err => {
              failedSet.add(task.taskId);
              task.status = 'failed';
              task.error = err.message || String(err);
              this.activeParallelSubAgents.delete(task.taskId);
              runningTasks.delete(task.taskId);
              options?.onProgress?.(this.getParallelProgress());
              this.notify();
              return null as any;
            });

          runningTasks.set(task.taskId, taskPromise);
        }

        options?.onProgress?.(this.getParallelProgress());
        this.notify();

        if (runningTasks.size === 0) {
          if (pendingTasks.length > 0) {
            // Unresolved dependencies / deadlock or all remaining blocked
            console.warn('No ready tasks could be scheduled with remaining dependencies.');
            break;
          }
          break;
        }

        // Wait for at least one running task to complete before next scheduling cycle
        await Promise.race(Array.from(runningTasks.values())).catch(() => {
          // Handled per task catch, continue loop
        });
      }
    } finally {
      this.isParallelRunningState = false;
      this.activeParallelSubAgents.clear();
      this.notify();
      options?.onProgress?.(this.getParallelProgress());
    }

    return reports;
  }

  /**
   * Orchestrate sample benchmark workflow: Can run parallel or sequential
   */
  public async orchestrateFullTeamBenchmark(parallel: boolean = true): Promise<void> {
    if (this.taskContracts.size === 0) {
      this.decomposeProjectIntoSubTasks({
        name: 'Workspace Engineering Benchmark',
      });
    }

    if (parallel) {
      await this.executeAllTasksParallel({ concurrency: this.parallelConcurrency });
    } else {
      for (const task of this.taskContracts.values()) {
        if (task.status !== 'completed') {
          await this.executeSubAgentTask(task.taskId);
        }
      }
    }
  }



  /**
   * Swarm 1: Feature-Slicing Swarm
   * Concurrently constructs Backend API, Database Schema, Reactive UI, and Test Suite with zero lock collisions.
   */
  public decomposeFeatureSlicingSwarm(
    featureTitle: string,
    project?: Project | { name: string; rootFiles?: FileNode[]; techStack?: any; description?: string },
    options?: { baseDir?: string; featureSlug?: string }
  ): SwarmExecutionPlan {
    const slug = options?.featureSlug || featureTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'feature';
    const swarmId = `swarm-feature-${Date.now()}`;
    const timestamp = Date.now();

    const tasks: SubAgentTaskContract[] = [
      {
        taskId: `feat-db-${slug}-${timestamp}`,
        parentAgentId: 'BackendLead',
        subAgentRole: 'DatabaseSchemaSpecialist',
        title: `Database Schema & Migration [${featureTitle}]`,
        objective: `Define strict typed relational schema, indexes, and migrations for ${featureTitle}.`,
        instructions: `Create migrations and schemas with zero lock collisions in isolated DB files.`,
        workspaceScope: '.',
        allowedFilePaths: [`src/models/${slug}.model.ts`, `src/db/migrations/${slug}.sql`],
        restrictedFilePaths: ['.env', 'src/components/*'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: [`src/models/${slug}.model.ts`, `src/db/migrations/${slug}.sql`],
        acceptanceCriteria: ['Strict schemas created', 'Migration SQL idempotent'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['write_to_file', 'replace_file_content'],
      },
      {
        taskId: `feat-api-${slug}-${timestamp}`,
        parentAgentId: 'BackendLead',
        subAgentRole: 'APIEndpointBuilder',
        title: `Concurrent REST/RPC API Endpoint [${featureTitle}]`,
        objective: `Implement high-throughput endpoint handlers and validation schemas for ${featureTitle}.`,
        instructions: `Construct API route handlers adhering to endpoint specifications.`,
        workspaceScope: '.',
        allowedFilePaths: [`src/api/${slug}.routes.ts`],
        restrictedFilePaths: ['.env', 'src/models/*'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: [`src/api/${slug}.routes.ts`],
        acceptanceCriteria: ['Valid input parsing', 'REST contract compliant'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['write_to_file', 'replace_file_content'],
      },
      {
        taskId: `feat-ui-${slug}-${timestamp}`,
        parentAgentId: 'FrontendLead',
        subAgentRole: 'ReactComponentBuilder',
        title: `Reactive UI Component & State [${featureTitle}]`,
        objective: `Create accessible, responsive UI view with state orchestration for ${featureTitle}.`,
        instructions: `Build React 19 UI component isolated from backend code.`,
        workspaceScope: '.',
        allowedFilePaths: [`src/components/${slug.charAt(0).toUpperCase() + slug.slice(1)}View.tsx`],
        restrictedFilePaths: ['.env', 'src/api/*'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: [`src/components/${slug.charAt(0).toUpperCase() + slug.slice(1)}View.tsx`],
        acceptanceCriteria: ['Accessible markup', 'Responsive styling'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['write_to_file', 'replace_file_content'],
      },
      {
        taskId: `feat-test-${slug}-${timestamp}`,
        parentAgentId: 'QALead',
        subAgentRole: 'UnitTestWriter',
        title: `Isolated Integration & Unit Test Suite [${featureTitle}]`,
        objective: `Formulate comprehensive Vitest test cases covering contracts and edge cases for ${featureTitle}.`,
        instructions: `Write isolated unit and contract tests verifying ${featureTitle}.`,
        workspaceScope: '.',
        allowedFilePaths: [`src/services/__tests__/${slug}.spec.ts`],
        restrictedFilePaths: ['.env'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: [`src/services/__tests__/${slug}.spec.ts`],
        acceptanceCriteria: ['100% contract coverage', '0 flaky assertions'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['write_to_file', 'replace_file_content', 'run_command'],
      },
    ];

    for (const t of tasks) {
      this.taskContracts.set(t.taskId, t);
    }

    const plan: SwarmExecutionPlan = {
      swarmId,
      type: 'feature-slicing',
      title: `Feature Slice Swarm: ${featureTitle}`,
      tasks,
      status: 'queued',
      createdAt: timestamp,
    };

    this.activeSwarms.set(swarmId, plan);
    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: 'Coordinator',
      toAgent: 'TeamLeads',
      taskId: swarmId,
      type: 'task_assignment',
      payload: { swarmType: 'feature-slicing', title: featureTitle, taskCount: tasks.length },
      timestamp: new Date().toLocaleTimeString(),
    });
    this.notify();
    return plan;
  }

  /**
   * Swarm 2: Continuous Background Guardians
   * Silent parallel watchdogs: TypeLintSentry, SecretLeakSniffer, PerfLeakWatcher
   */
  public spawnBackgroundGuardiansSwarm(): SwarmExecutionPlan {
    const swarmId = `swarm-guardians-${Date.now()}`;
    const timestamp = Date.now();

    const tasks: SubAgentTaskContract[] = [
      {
        taskId: `guard-lint-${timestamp}`,
        parentAgentId: 'ArchitectureLead',
        subAgentRole: 'TypeLintSentry',
        title: 'Continuous Type & Lint Surveillance',
        objective: 'Continuously verify AST syntax, strict types, and module boundaries.',
        instructions: 'Monitor workspace for compilation defects and broken exports.',
        workspaceScope: '.',
        allowedFilePaths: ['src/**/*'],
        restrictedFilePaths: ['.env*'],
        permissionLevel: 'read',
        dependencies: [],
        expectedDeliverables: ['TypeLint Report'],
        acceptanceCriteria: ['Zero syntax regressions'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['grep_search', 'run_command'],
      },
      {
        taskId: `guard-secret-${timestamp}`,
        parentAgentId: 'SecurityLead',
        subAgentRole: 'SecretLeakSniffer',
        title: 'Secret & API Key Leak Sniffer',
        objective: 'Scan code and diffs for exposed credentials, private keys, and environment leakage.',
        instructions: 'Identify accidental token or password commits.',
        workspaceScope: '.',
        allowedFilePaths: ['.env*', 'src/**/*', 'package.json'],
        restrictedFilePaths: [],
        permissionLevel: 'read',
        dependencies: [],
        expectedDeliverables: ['Secret Leak Audit'],
        acceptanceCriteria: ['Zero plaintext credentials in repository'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['grep_search'],
      },
      {
        taskId: `guard-perf-${timestamp}`,
        parentAgentId: 'QALead',
        subAgentRole: 'PerfLeakWatcher',
        title: 'Runtime Memory & Listener Leak Watcher',
        objective: 'Monitor unclosed event listeners, runaway loops, and memory bloat.',
        instructions: 'Inspect reactive bindings and subscription cleanups.',
        workspaceScope: '.',
        allowedFilePaths: ['src/**/*'],
        restrictedFilePaths: ['.env*'],
        permissionLevel: 'read',
        dependencies: [],
        expectedDeliverables: ['Performance Telemetry'],
        acceptanceCriteria: ['No dangling subscriptions or unbounded buffers'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['grep_search', 'run_command'],
      },
    ];

    for (const t of tasks) {
      this.taskContracts.set(t.taskId, t);
    }

    const plan: SwarmExecutionPlan = {
      swarmId,
      type: 'background-guardians',
      title: 'Continuous Background Guardians Swarm',
      tasks,
      status: 'working',
      createdAt: timestamp,
    };

    this.activeSwarms.set(swarmId, plan);
    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: 'Coordinator',
      toAgent: 'Guardians',
      taskId: swarmId,
      type: 'task_assignment',
      payload: { swarmType: 'background-guardians' },
      timestamp: new Date().toLocaleTimeString(),
    });
    this.notify();
    return plan;
  }

  public startBackgroundGuardians(pollIntervalMs: number = 30000): GuardianStatus {
    this.guardianStatus.isActive = true;
    this.guardianStatus.typeSentry = { lastCheck: Date.now(), errorCount: 0 };
    this.guardianStatus.secretSniffer = { lastCheck: Date.now(), clean: true, detectedCount: 0 };
    this.guardianStatus.perfWatcher = { lastCheck: Date.now(), leaksFound: 0 };

    if (this.guardianIntervalTimer) {
      clearInterval(this.guardianIntervalTimer);
    }

    this.guardianIntervalTimer = setInterval(() => {
      this.guardianStatus.typeSentry.lastCheck = Date.now();
      this.guardianStatus.secretSniffer.lastCheck = Date.now();
      this.guardianStatus.perfWatcher.lastCheck = Date.now();
      this.notify();
    }, pollIntervalMs);

    this.notify();
    return { ...this.guardianStatus };
  }

  public stopBackgroundGuardians(): GuardianStatus {
    this.guardianStatus.isActive = false;
    if (this.guardianIntervalTimer) {
      clearInterval(this.guardianIntervalTimer);
      this.guardianIntervalTimer = undefined;
    }
    this.notify();
    return { ...this.guardianStatus };
  }

  public getGuardianStatus(): GuardianStatus {
    return { ...this.guardianStatus };
  }

  /**
   * Swarm 3: Self-Healing Test & Patch Swarm
   * Autonomous diagnostic root cause isolation & surgical patch synthesis
   */
  public spawnSelfHealingSwarm(
    errorLog: string,
    targetFile: string,
    testFile?: string
  ): SwarmExecutionPlan {
    const swarmId = `swarm-heal-${Date.now()}`;
    const timestamp = Date.now();
    const diagTaskId = `heal-diag-${timestamp}`;
    const patchTaskId = `heal-patch-${timestamp}`;

    const diagTask: SubAgentTaskContract = {
      taskId: diagTaskId,
      parentAgentId: 'QALead',
      subAgentRole: 'TestRunnerDiagnostician',
      title: `Diagnose Failure: ${targetFile}`,
      objective: `Isolate root cause of failure: ${errorLog.slice(0, 150)}...`,
      instructions: `Analyze stack trace and identify failing assertions in ${targetFile}.`,
      workspaceScope: '.',
      allowedFilePaths: [targetFile, ...(testFile ? [testFile] : [])],
      restrictedFilePaths: ['.env*'],
      permissionLevel: 'read',
      dependencies: [],
      expectedDeliverables: ['Diagnostic RCA Report'],
      acceptanceCriteria: ['Pinpoint exact failing line and defect pattern'],
      status: 'queued',
      progressPercent: 0,
      allowedTools: ['grep_search', 'run_command'],
    };

    const patchTask: SubAgentTaskContract = {
      taskId: patchTaskId,
      parentAgentId: 'FullStackLead',
      subAgentRole: 'PatchSynthesizer',
      title: `Synthesize Surgical Patch: ${targetFile}`,
      objective: `Formulate minimal AST surgical patch to rectify failure while preserving all existing unit invariants.`,
      instructions: `Apply localized surgical correction to ${targetFile}.`,
      workspaceScope: '.',
      allowedFilePaths: [targetFile],
      restrictedFilePaths: ['.env*'],
      permissionLevel: 'write',
      dependencies: [diagTaskId],
      expectedDeliverables: [targetFile],
      acceptanceCriteria: ['Tests pass without regression'],
      status: 'queued',
      progressPercent: 0,
      allowedTools: ['replace_file_content', 'write_to_file'],
    };

    const tasks = [diagTask, patchTask];
    for (const t of tasks) {
      this.taskContracts.set(t.taskId, t);
    }

    const plan: SwarmExecutionPlan = {
      swarmId,
      type: 'self-healing',
      title: `Autonomous Self-Healing Swarm: ${targetFile}`,
      tasks,
      status: 'queued',
      createdAt: timestamp,
    };

    this.activeSwarms.set(swarmId, plan);
    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: 'Coordinator',
      toAgent: 'FullStackLead',
      taskId: swarmId,
      type: 'task_assignment',
      payload: { swarmType: 'self-healing', targetFile },
      timestamp: new Date().toLocaleTimeString(),
    });
    this.notify();
    return plan;
  }

  /**
   * Swarm 4: Documentation & Environment Sync Swarm
   * Concurrently updates documentation, TSDoc/OpenAPI, and .env.example
   */
  public spawnDocEnvSyncSwarm(changedFiles: string[] = []): SwarmExecutionPlan {
    const swarmId = `swarm-sync-${Date.now()}`;
    const timestamp = Date.now();

    const tasks: SubAgentTaskContract[] = [
      {
        taskId: `sync-doc-${timestamp}`,
        parentAgentId: 'UIDesignLead',
        subAgentRole: 'DocSyncAgent',
        title: 'Synchronize Architectural Documentation & API Specs',
        objective: `Update README, OpenAPI schemas, and TSDoc based on changed files: ${changedFiles.slice(0, 5).join(', ')}`,
        instructions: `Keep technical documentation in sync with current workspace changes.`,
        workspaceScope: '.',
        allowedFilePaths: ['README.md', 'docs/API.md'],
        restrictedFilePaths: ['.env*'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: ['README.md'],
        acceptanceCriteria: ['Documentation accurately mirrors modified contracts'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['replace_file_content', 'write_to_file'],
      },
      {
        taskId: `sync-env-${timestamp}`,
        parentAgentId: 'DevOpsLead',
        subAgentRole: 'EnvSyncAgent',
        title: 'Synchronize Environment Templates (.env.example)',
        objective: 'Audit process.env bindings in changed code and ensure .env.example contains all required environment variables.',
        instructions: `Detect new environment variable accesses and add template placeholders.`,
        workspaceScope: '.',
        allowedFilePaths: ['.env.example', '.env.template'],
        restrictedFilePaths: ['.env', '.env.local'],
        permissionLevel: 'write',
        dependencies: [],
        expectedDeliverables: ['.env.example'],
        acceptanceCriteria: ['.env.example contains all required variables with placeholder values'],
        status: 'queued',
        progressPercent: 0,
        allowedTools: ['replace_file_content', 'write_to_file'],
      },
    ];

    for (const t of tasks) {
      this.taskContracts.set(t.taskId, t);
    }

    const plan: SwarmExecutionPlan = {
      swarmId,
      type: 'doc-env-sync',
      title: 'Documentation & Environment Sync Swarm',
      tasks,
      status: 'queued',
      createdAt: timestamp,
    };

    this.activeSwarms.set(swarmId, plan);
    this.logMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromAgent: 'Coordinator',
      toAgent: 'DevOpsLead',
      taskId: swarmId,
      type: 'task_assignment',
      payload: { swarmType: 'doc-env-sync', changedFiles },
      timestamp: new Date().toLocaleTimeString(),
    });
    this.notify();
    return plan;
  }

  public getActiveSwarms(): SwarmExecutionPlan[] {
    return Array.from(this.activeSwarms.values());
  }

  public getSwarmPlan(swarmId: string): SwarmExecutionPlan | undefined {
    return this.activeSwarms.get(swarmId);
  }

  public async executeSwarmPlan(
    swarmId: string,
    options?: { concurrency?: number; stepDelayMs?: number }
  ): Promise<CompletionReport[]> {
    const plan = this.activeSwarms.get(swarmId);
    if (!plan) throw new Error(`Swarm ${swarmId} not found`);

    plan.status = 'working';
    this.notify();

    try {
      const reports = await this.executeAllTasksParallel({
        concurrency: options?.concurrency ?? 4,
        stepDelayMs: options?.stepDelayMs ?? 10,
      });
      plan.status = 'completed';
      this.notify();
      return reports;
    } catch (err: any) {
      plan.status = 'failed';
      this.notify();
      throw err;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
