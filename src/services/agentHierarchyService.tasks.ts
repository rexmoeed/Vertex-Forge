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
import { decomposeProjectIntoSubTasks } from './agentHierarchyService.decomposition';

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
    return decomposeProjectIntoSubTasks(
      {
        resetAllTasks: () => this.resetAllTasks(),
        delegateTask: (c) => this.delegateTask(c),
        logPlanDecompositionMessage: (payload) => {
          this.logMessage({
            id: `msg-${Date.now()}-plan`,
            fromAgent: 'Orchestrator',
            toAgent: 'AllTeamLeads',
            taskId: 'plan-decomposition',
            type: 'task_assignment',
            payload,
            timestamp: new Date().toLocaleTimeString(),
          });
        },
        getTasks: () => this.getTasks(),
        notify: () => this.notify(),
      },
      this.vfs,
      project,
      userGoal
    );
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
