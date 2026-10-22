import {
  SubAgentTaskContract,
  SwarmExecutionPlan,
  GuardianStatus,
  CompletionReport,
  AgentMessage,
} from '../types/agentHierarchy';
import { Project, FileNode } from '../types/ide';
import { AgentTasksManager } from './agentHierarchyService.tasks';
import { AgentLeadsManager } from './agentHierarchyService.leads';
import { logger } from './logger';

export class AgentSwarmsManager {
  private tasksManager: AgentTasksManager;
  private leadsManager: AgentLeadsManager;
  private guardianStatus: GuardianStatus = {
    isActive: false,
    typeSentry: { lastCheck: 0, errorCount: 0 },
    secretSniffer: { lastCheck: 0, clean: true, detectedCount: 0 },
    perfWatcher: { lastCheck: 0, leaksFound: 0 },
  };
  private guardianIntervalTimer?: any;
  private activeSwarms: Map<string, SwarmExecutionPlan> = new Map();
  private notifyCallback?: () => void;

  constructor(
    tasksManager: AgentTasksManager,
    leadsManager: AgentLeadsManager,
    notifyCallback?: () => void
  ) {
    this.tasksManager = tasksManager;
    this.leadsManager = leadsManager;
    this.notifyCallback = notifyCallback;
  }

  public setNotifyCallback(cb: () => void) {
    this.notifyCallback = cb;
  }

  private notify() {
    if (this.notifyCallback) this.notifyCallback();
  }

  private get leads() {
    return this.leadsManager.getLeadsMap();
  }

  private get taskContracts() {
    return this.tasksManager.getTaskContractsMap();
  }

  private get fileReservations() {
    return this.tasksManager.getFileReservationsMap();
  }

  private get completionReports() {
    return this.tasksManager.getCompletionReportsMap();
  }

  private logMessage(msg: AgentMessage) {
    this.leadsManager.addMessage(msg);
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
      const reports = await this.tasksManager.executeAllTasksParallel({
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
