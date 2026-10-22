/**
 * AgentHierarchyService - Modular Facade
 * Decomposed into specialist leads, task contracts, and swarm orchestration engines:
 * - agentHierarchyService.leads.ts (Specialist Lead definitions and governance)
 * - agentHierarchyService.tasks.ts (Lock reservations, task decomposition & parallel execution)
 * - agentHierarchyService.swarms.ts (Swarm execution plans, self-healing & background guardians)
 */

import {
  TeamLeadRole,
  SubAgentTaskContract,
  CompletionReport,
  AgentMessage,
  FileReservation,
  SpecialistLeadInfo,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
  SwarmExecutionPlan,
  GuardianStatus,
} from '../types/agentHierarchy';
import { VirtualFileSystem } from './virtualFs';
import { Project, FileNode } from '../types/ide';
import { AgentLeadsManager } from './agentHierarchyService.leads';
import { AgentTasksManager } from './agentHierarchyService.tasks';
import { AgentSwarmsManager } from './agentHierarchyService.swarms';

export { AgentLeadsManager } from './agentHierarchyService.leads';
export { AgentTasksManager } from './agentHierarchyService.tasks';
export { AgentSwarmsManager } from './agentHierarchyService.swarms';

export class AgentHierarchyService {
  private leads: AgentLeadsManager;
  private tasks: AgentTasksManager;
  private swarms: AgentSwarmsManager;
  private onUpdateCallback?: () => void;

  constructor(vfs: VirtualFileSystem) {
    this.leads = new AgentLeadsManager(() => this.notify());
    this.tasks = new AgentTasksManager(vfs, this.leads, () => this.notify());
    this.swarms = new AgentSwarmsManager(this.tasks, this.leads, () => this.notify());
  }

  public setUpdateListener(callback: () => void) {
    this.onUpdateCallback = callback;
  }

  private notify() {
    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  // --- Specialist Leads API ---
  public getLeads(): SpecialistLeadInfo[] {
    return this.leads.getLeads();
  }

  public getMessages(): AgentMessage[] {
    return this.leads.getMessages();
  }

  // --- Task Contracts & File Reservations API ---
  public getTasks(): SubAgentTaskContract[] {
    return this.tasks.getTasks();
  }

  public getCompletionReports(): CompletionReport[] {
    return this.tasks.getCompletionReports();
  }

  public getFileReservations(): FileReservation[] {
    return this.tasks.getFileReservations();
  }

  public getParallelConcurrency(): number {
    return this.tasks.getParallelConcurrency();
  }

  public setParallelConcurrency(concurrency: number): void {
    this.tasks.setParallelConcurrency(concurrency);
  }

  public isParallelRunning(): boolean {
    return this.tasks.isParallelRunning();
  }

  public getActiveParallelSubAgents(): ParallelSubAgentActiveInfo[] {
    return this.tasks.getActiveParallelSubAgents();
  }

  public getParallelProgress(): ParallelProgressInfo {
    return this.tasks.getParallelProgress();
  }

  public cancelParallelExecution(): void {
    this.tasks.cancelParallelExecution();
  }

  public resetAllTasks(): void {
    this.tasks.resetAllTasks();
  }

  public reserveFile(
    filePath: string,
    subAgentId: string,
    parentLead: TeamLeadRole,
    mode: 'exclusive_write' | 'read_only' = 'exclusive_write'
  ): { success: boolean; conflictWith?: string } {
    return this.tasks.reserveFile(filePath, subAgentId, parentLead, mode);
  }

  public releaseFile(filePath: string, subAgentId: string) {
    this.tasks.releaseFile(filePath, subAgentId);
  }

  public delegateTask(contract: Omit<SubAgentTaskContract, 'status' | 'progressPercent'>): SubAgentTaskContract {
    return this.tasks.delegateTask(contract);
  }

  public decomposeProjectIntoSubTasks(
    project?: Project | { name: string; rootFiles?: FileNode[]; techStack?: any; description?: string },
    userGoal?: string
  ): SubAgentTaskContract[] {
    return this.tasks.decomposeProjectIntoSubTasks(project, userGoal);
  }

  public async executeSubAgentTask(
    taskId: string,
    options?: { stepDelayMs?: number; abortSignal?: AbortSignal }
  ): Promise<CompletionReport> {
    return this.tasks.executeSubAgentTask(taskId, options);
  }

  public async executeAllTasksParallel(options?: {
    concurrency?: number;
    stepDelayMs?: number;
    abortSignal?: AbortSignal;
    onProgress?: (progress: ParallelProgressInfo) => void;
  }): Promise<CompletionReport[]> {
    return this.tasks.executeAllTasksParallel(options);
  }

  public async orchestrateFullTeamBenchmark(parallel: boolean = true): Promise<void> {
    return this.tasks.orchestrateFullTeamBenchmark(parallel);
  }

  // --- Swarm Orchestration & Guardians API ---
  public decomposeFeatureSlicingSwarm(
    featureTitle: string,
    project?: Project | { name: string; rootFiles?: FileNode[]; techStack?: any; description?: string },
    options?: { baseDir?: string; featureSlug?: string }
  ): SwarmExecutionPlan {
    return this.swarms.decomposeFeatureSlicingSwarm(featureTitle, project, options);
  }

  public spawnBackgroundGuardiansSwarm(): SwarmExecutionPlan {
    return this.swarms.spawnBackgroundGuardiansSwarm();
  }

  public startBackgroundGuardians(pollIntervalMs: number = 30000): GuardianStatus {
    return this.swarms.startBackgroundGuardians(pollIntervalMs);
  }

  public stopBackgroundGuardians(): GuardianStatus {
    return this.swarms.stopBackgroundGuardians();
  }

  public getGuardianStatus(): GuardianStatus {
    return this.swarms.getGuardianStatus();
  }

  public spawnSelfHealingSwarm(
    errorLog: string,
    targetFile: string,
    testFile?: string
  ): SwarmExecutionPlan {
    return this.swarms.spawnSelfHealingSwarm(errorLog, targetFile, testFile);
  }

  public spawnDocEnvSyncSwarm(changedFiles: string[] = []): SwarmExecutionPlan {
    return this.swarms.spawnDocEnvSyncSwarm(changedFiles);
  }

  public getActiveSwarms(): SwarmExecutionPlan[] {
    return this.swarms.getActiveSwarms();
  }

  public getSwarmPlan(swarmId: string): SwarmExecutionPlan | undefined {
    return this.swarms.getSwarmPlan(swarmId);
  }

  public async executeSwarmPlan(
    swarmId: string,
    options?: { concurrency?: number; stepDelayMs?: number }
  ): Promise<CompletionReport[]> {
    return this.swarms.executeSwarmPlan(swarmId, options);
  }
}
