import { AgentTaskExecutor } from './agentHierarchyService.executor';
import {
  SubAgentTaskContract,
  CompletionReport,
  FileReservation,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
  TeamLeadRole,
  AgentMessage,
} from '../types/agentHierarchy';
import { VirtualFileSystem } from './virtualFs';
import { Project, FileNode } from '../types/ide';
import { AgentLeadsManager } from './agentHierarchyService.leads';
import { logger } from './logger';

export class AgentTasksManager {
  private vfs: VirtualFileSystem;
  private leadsManager: AgentLeadsManager;
  private taskContracts: Map<string, SubAgentTaskContract> = new Map();
  private completionReports: Map<string, CompletionReport> = new Map();
  private fileReservations: Map<string, FileReservation[]> = new Map();
  private executor: AgentTaskExecutor;
  private notifyCallback?: () => void;

  constructor(
    vfs: VirtualFileSystem,
    leadsManager: AgentLeadsManager,
    notifyCallback?: () => void
  ) {
    this.vfs = vfs;
    this.leadsManager = leadsManager;
    this.notifyCallback = notifyCallback;
    this.executor = new AgentTaskExecutor(vfs, leadsManager, this, () => this.notify());
  }

  public setNotifyCallback(cb: () => void) {
    this.notifyCallback = cb;
    this.executor.setNotifyCallback(() => this.notify());
  }

  private notify() {
    if (this.notifyCallback) this.notifyCallback();
  }

  private get leads() {
    return this.leadsManager.getLeadsMap();
  }

  private get messageLog() {
    return this.leadsManager.getMessages();
  }

  private logMessage(msg: AgentMessage) {
    this.leadsManager.addMessage(msg);
  }

  public getTaskContractsMap(): Map<string, SubAgentTaskContract> {
    return this.taskContracts;
  }

  public getCompletionReportsMap(): Map<string, CompletionReport> {
    return this.completionReports;
  }

  public getFileReservationsMap(): Map<string, FileReservation[]> {
    return this.fileReservations;
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
    return this.executor.getParallelConcurrency();
  }

  public setParallelConcurrency(concurrency: number): void {
    this.executor.setParallelConcurrency(concurrency);
  }

  public isParallelRunning(): boolean {
    return this.executor.isParallelRunning();
  }

  public getActiveParallelSubAgents(): ParallelSubAgentActiveInfo[] {
    return this.executor.getActiveParallelSubAgents();
  }

  public getParallelProgress(): ParallelProgressInfo {
    return this.executor.getParallelProgress();
  }

  public cancelParallelExecution(): void {
    this.executor.cancelParallelExecution();
  }

  public resetAllTasks(): void {
    this.taskContracts.clear();
    this.completionReports.clear();
    this.fileReservations.clear();
    this.executor.cancelParallelExecution();

    // Reset lead statuses
    for (const lead of this.leads.values()) {
      lead.status = 'idle';
      lead.currentTaskTitle = undefined;
      lead.activeReservations = [];
    }

    this.notify();
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

  public async executeSubAgentTask(
    taskId: string,
    options?: { stepDelayMs?: number; simulateSteps?: boolean }
  ): Promise<CompletionReport> {
    return this.executor.executeSubAgentTask(taskId, options);
  }

  public async executeAllTasksParallel(options?: {
    stepDelayMs?: number;
    concurrency?: number;
    simulateSteps?: boolean;
    onProgress?: (progress: ParallelProgressInfo) => void;
  }): Promise<CompletionReport[]> {
    return this.executor.executeAllTasksParallel(options);
  }

  public async orchestrateFullTeamBenchmark(parallel: boolean = true): Promise<void> {
    return this.executor.orchestrateFullTeamBenchmark(parallel);
  }
}
