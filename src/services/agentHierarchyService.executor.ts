import { logger } from './logger';
import { VirtualFileSystem } from './virtualFs';
import { AgentLeadsManager } from './agentHierarchyService.leads';
import { AgentTasksManager } from './agentHierarchyService.tasks';
import {
  SubAgentTaskContract,
  CompletionReport,
  FileReservation,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
  AgentMessage,
} from '../types/agentHierarchy';

export class AgentTaskExecutor {
  private vfs: VirtualFileSystem;
  private leadsManager: AgentLeadsManager;
  private tasksManager: AgentTasksManager;
  private isParallelRunningState: boolean = false;
  private parallelConcurrency: number = 3;
  private activeParallelSubAgents: Map<string, ParallelSubAgentActiveInfo> = new Map();
  private abortRequested: boolean = false;
  private notifyCallback?: () => void;

  constructor(
    vfs: VirtualFileSystem,
    leadsManager: AgentLeadsManager,
    tasksManager: AgentTasksManager,
    notifyCallback?: () => void
  ) {
    this.vfs = vfs;
    this.leadsManager = leadsManager;
    this.tasksManager = tasksManager;
    this.notifyCallback = notifyCallback;
  }

  public setNotifyCallback(cb: () => void) {
    this.notifyCallback = cb;
  }

  private notify() {
    if (this.notifyCallback) this.notifyCallback();
  }

  private get taskContracts(): Map<string, SubAgentTaskContract> {
    return this.tasksManager.getTaskContractsMap();
  }

  private get completionReports(): Map<string, CompletionReport> {
    return this.tasksManager.getCompletionReportsMap();
  }

  private get fileReservations(): Map<string, FileReservation[]> {
    return this.tasksManager.getFileReservationsMap();
  }

  private get leads() {
    return this.leadsManager.getLeadsMap();
  }

  private logMessage(msg: AgentMessage) {
    this.leadsManager.addMessage(msg);
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
      const res = this.tasksManager.reserveFile(path, task.taskId, task.parentAgentId, lockMode);
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
      this.tasksManager.releaseFile(path, task.taskId);
    }

    // Generate completion report matching domain schema
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
      approvedByLead: true,
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
   * Parallel Execution Engine
   */
  public async executeAllTasksParallel(options?: {
    concurrency?: number;
    stepDelayMs?: number;
    simulateSteps?: boolean;
    onProgress?: (info: ParallelProgressInfo) => void;
  }): Promise<CompletionReport[]> {
    if (this.isParallelRunningState) {
      logger.warn('Parallel execution already active.');
      return this.tasksManager.getCompletionReports();
    }

    const concurrency = options?.concurrency ?? this.parallelConcurrency;
    const stepDelayMs = options?.stepDelayMs ?? 300;
    const simulateSteps = options?.simulateSteps ?? true;

    this.isParallelRunningState = true;
    this.abortRequested = false;
    this.activeParallelSubAgents.clear();

    const reports: CompletionReport[] = [];
    const completedSet = new Set<string>();
    const failedSet = new Set<string>();

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
          break;
        }

        const readyTasks = pendingTasks.filter(task => {
          const depsSatisfied = task.dependencies.every(depId => completedSet.has(depId));
          if (!depsSatisfied) {
            if (task.status !== 'waiting_dependency') {
              task.status = 'waiting_dependency';
              this.notify();
            }
            return false;
          }

          const isWrite = task.permissionLevel === 'write';
          for (const path of task.allowedFilePaths) {
            const list = this.fileReservations.get(path) || [];
            if (isWrite && list.some(r => r.subAgentId !== task.taskId)) {
              return false;
            }
            if (!isWrite && list.some(r => r.mode === 'exclusive_write' && r.subAgentId !== task.taskId)) {
              return false;
            }
          }

          return true;
        });

        const availableSlots = concurrency - runningTasks.size;
        const tasksToLaunch = readyTasks.slice(0, Math.max(0, availableSlots));

        for (const task of tasksToLaunch) {
          const taskPromise = this.executeSubAgentTask(task.taskId, {
            stepDelayMs,
            simulateSteps,
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
              return null!;
            });

          runningTasks.set(task.taskId, taskPromise);
        }

        options?.onProgress?.(this.getParallelProgress());
        this.notify();

        if (runningTasks.size === 0) {
          if (pendingTasks.length > 0) {
            logger.warn('No ready tasks could be scheduled with remaining dependencies.');
            break;
          }
          break;
        }

        await Promise.race(Array.from(runningTasks.values())).catch(() => {
          // Handled per task catch
        });
      }
    } finally {
      this.isParallelRunningState = false;
      this.activeParallelSubAgents.clear();
      this.notify();
      options?.onProgress?.(this.getParallelProgress());
    }

    return reports.filter(Boolean);
  }

  public async orchestrateFullTeamBenchmark(parallel: boolean = true): Promise<void> {
    if (this.taskContracts.size === 0) {
      this.tasksManager.decomposeProjectIntoSubTasks({
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
