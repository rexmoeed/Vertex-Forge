/**
 * Autonomous AI Software Engineer - Core Engine
 * Implements the complete multi-step autonomous execution loop:
 * Understand → Inspect → Plan → Execute → Observe → Diagnose → Correct → Verify → Summarize
 * with real state machine, safety permissions, checkpoints, and verifications.
 */

import {
  AutonomousPlan,
  AutonomousTask,
  AutonomousExecutionState,
  StepExecutionRecord,
  VerificationSummary,
  PermissionMode,
} from '../types/autonomousAgent';
import { AgentToolRegistry } from './agentToolRegistry';
import { VirtualFileSystem } from './virtualFs';
import { GeminiService } from './geminiService';
import { ProjectProfile } from '../types/project';
import { AutonomousPlanGenerator } from './agent/autonomousPlanGenerator';
import { AutonomousVerificationService } from './agent/autonomousVerificationService';

export interface AutonomousEngineEvents {
  onPlanCreated?: (plan: AutonomousPlan) => void;
  onPlanStatusChange?: (status: AutonomousPlan['status']) => void;
  onTaskStatusChange?: (taskId: string, status: AutonomousTask['status']) => void;
  onStepExecuted?: (taskId: string, step: StepExecutionRecord) => void;
  onExecutionStateChange?: (state: AutonomousExecutionState) => void;
  onVerificationComplete?: (summary: VerificationSummary) => void;
  onLogMessage?: (role: string, message: string, type: 'info' | 'tool_call' | 'success' | 'warning' | 'error') => void;
}

export class AutonomousAgentEngine {
  private vfs: VirtualFileSystem;
  private toolRegistry: AgentToolRegistry;
  private events: AutonomousEngineEvents = {};

  private currentPlan: AutonomousPlan | null = null;
  private executionState: AutonomousExecutionState = 'idle';
  private permissionMode: PermissionMode = 'autonomous';
  private projectProfile?: ProjectProfile;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private stepBudgetPerTask: number = 15;
  private maxRetriesPerTask: number = 3;

  constructor(
    vfs: VirtualFileSystem,
    permissionMode: PermissionMode = 'autonomous',
    projectProfile?: ProjectProfile
  ) {
    this.vfs = vfs;
    this.permissionMode = permissionMode;
    this.projectProfile = projectProfile;
    this.toolRegistry = new AgentToolRegistry(vfs, permissionMode);
  }

  public setEvents(events: AutonomousEngineEvents) {
    this.events = events;
  }

  public setPermissionMode(mode: PermissionMode) {
    this.permissionMode = mode;
    this.toolRegistry.setPermissionMode(mode);
  }

  public getPermissionMode(): PermissionMode {
    return this.permissionMode;
  }

  public getExecutionState(): AutonomousExecutionState {
    return this.executionState;
  }

  public getCurrentPlan(): AutonomousPlan | null {
    return this.currentPlan;
  }

  public getToolRegistry(): AgentToolRegistry {
    return this.toolRegistry;
  }

  private setExecutionState(state: AutonomousExecutionState) {
    this.executionState = state;
    if (this.events.onExecutionStateChange) {
      this.events.onExecutionStateChange(state);
    }
  }

  private log(role: string, message: string, type: 'info' | 'tool_call' | 'success' | 'warning' | 'error' = 'info') {
    if (this.events.onLogMessage) {
      this.events.onLogMessage(role, message, type);
    }
  }

  // ==========================================
  // STAGE 1 & 2: UNDERSTAND, INSPECT & PLAN
  // ==========================================

  public async planGoal(userGoal: string): Promise<AutonomousPlan> {
    this.isCancelled = false;
    this.isPaused = false;
    this.setExecutionState('planning');
    this.log('Architect', `Analyzing workspace and goal: "${userGoal}"`, 'info');

    const plan = await AutonomousPlanGenerator.planGoal(
      userGoal,
      this.vfs,
      this.toolRegistry,
      this.permissionMode,
      this.maxRetriesPerTask
    );

    this.currentPlan = plan;
    if (this.events.onPlanCreated) {
      this.events.onPlanCreated(plan);
    }

    if (this.permissionMode === 'strict' || this.permissionMode === 'supervised') {
      this.setExecutionState('waiting_plan_approval');
      this.log('Architect', `Plan generated with ${plan.tasks.length} tasks. Waiting for human approval.`, 'info');
    } else {
      plan.status = 'approved';
      this.setExecutionState('idle');
      this.log('Architect', `Plan approved autonomously (${plan.tasks.length} tasks). Ready to execute.`, 'success');
    }

    return plan;
  }

  // ==========================================
  // USER CONTROLS: APPROVE, REJECT, PAUSE, CANCEL
  // ==========================================

  public approvePlan() {
    if (!this.currentPlan) return;
    this.currentPlan.status = 'approved';
    this.log('Architect', 'Human approved autonomous engineering plan.', 'success');
    if (this.events.onPlanStatusChange) {
      this.events.onPlanStatusChange('approved');
    }
    this.executePlan();
  }

  public rejectPlan() {
    if (!this.currentPlan) return;
    this.currentPlan.status = 'rejected';
    this.setExecutionState('cancelled');
    this.log('Architect', 'Human rejected autonomous engineering plan.', 'warning');
    if (this.events.onPlanStatusChange) {
      this.events.onPlanStatusChange('rejected');
    }
  }

  public pause() {
    this.isPaused = true;
    this.setExecutionState('paused');
    this.log('Architect', 'Autonomous execution paused by user.', 'warning');
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.log('Architect', 'Resuming autonomous execution...', 'info');
    this.executePlan();
  }

  public cancel() {
    this.isCancelled = true;
    this.isPaused = false;
    if (this.currentPlan) {
      this.currentPlan.status = 'cancelled';
    }
    this.setExecutionState('cancelled');
    this.log('Architect', 'Autonomous execution halted and cancelled by user.', 'warning');
  }

  public async rollback(checkpointId?: string): Promise<{ success: boolean; revertedFiles: string[] }> {
    const chkId = checkpointId || this.currentPlan?.tasks.find(t => t.checkpointId)?.checkpointId;
    if (!chkId) {
      this.log('Architect', 'No checkpoint found to rollback.', 'warning');
      return { success: false, revertedFiles: [] };
    }

    this.log('Architect', `Rolling back agent modifications from checkpoint ${chkId}...`, 'info');
    const result = await this.toolRegistry.rollbackCheckpoint(chkId);
    if (result.success) {
      this.log('Architect', `Successfully reverted ${result.revertedFiles.length} files.`, 'success');
    } else {
      this.log('Architect', `Rollback error: ${result.error}`, 'error');
    }
    return result;
  }

  public async retryTask(taskId: string) {
    if (!this.currentPlan) return;
    const task = this.currentPlan.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'pending';
    task.retryCount = 0;
    task.error = undefined;
    this.log('Architect', `Retrying task "${task.title}"...`, 'info');
    await this.executePlan();
  }

  // ==========================================
  // STAGE 3-7: MULTI-STEP EXECUTION LOOP
  // ==========================================

  public async executePlan(): Promise<VerificationSummary> {
    if (!this.currentPlan) {
      throw new Error('No plan available to execute.');
    }

    this.setExecutionState('executing');
    this.currentPlan.status = 'in_progress';

    const filesModifiedGlobally = new Set<string>();
    const commandsExecutedGlobally: Array<{ command: string; exitCode: number; success: boolean }> = [];

    for (let taskIdx = 0; taskIdx < this.currentPlan.tasks.length; taskIdx++) {
      if (this.isCancelled) break;
      if (this.isPaused) {
        this.setExecutionState('paused');
        return AutonomousVerificationService.createEmptyVerification();
      }

      const task = this.currentPlan.tasks[taskIdx];
      if (task.status === 'completed') continue;

      // Check task dependencies
      const uncompletedDep = task.dependencies.find(depId => {
        const dep = this.currentPlan?.tasks.find(t => t.id === depId);
        return dep && dep.status !== 'completed';
      });

      if (uncompletedDep) {
        task.status = 'blocked';
        this.notifyTaskStatus(task.id, 'blocked');
        this.log(task.role, `Task "${task.title}" blocked by dependency ${uncompletedDep}.`, 'warning');
        continue;
      }

      // Check Task Approval if required
      if (task.requiresApproval && task.approvalStatus === 'pending') {
        task.status = 'waiting_approval';
        this.setExecutionState('waiting_step_approval');
        this.notifyTaskStatus(task.id, 'waiting_approval');
        this.log(task.role, `Waiting for user approval to execute "${task.title}"`, 'info');
        return AutonomousVerificationService.createEmptyVerification();
      }

      // Execute Single Autonomous Task
      task.status = 'running';
      this.notifyTaskStatus(task.id, 'running');
      this.log(task.role, `Starting execution: "${task.title}"`, 'info');

      // Create pre-task checkpoint
      const checkpoint = await this.toolRegistry.createCheckpoint(
        task.id,
        task.targetFiles,
        `Pre-task checkpoint for ${task.title}`
      );
      task.checkpointId = checkpoint.id;

      let taskSuccess = false;
      let stepCount = 0;

      while (!taskSuccess && stepCount < this.stepBudgetPerTask && !this.isCancelled && !this.isPaused) {
        stepCount++;

        // 1. INSPECT target files
        for (const file of task.targetFiles) {
          const readRes = await this.toolRegistry.executeTool('read_file', { filePath: file }, task.id);
          this.recordStep(task, {
            id: `step-${Date.now()}-${stepCount}`,
            stepIndex: stepCount,
            tool: 'read_file',
            args: { filePath: file },
            result: readRes,
            rationale: `Inspect existing source code of ${file}`,
            observation: readRes.success ? `Read ${readRes.data?.totalLines || 0} lines.` : `File not found, will create.`,
            timestamp: Date.now(),
          });
        }

        // 2. SYNTHESIZE OR RETRY CODE EDITS
        const primaryFile = task.targetFiles[0] || 'src/App.tsx';
        const existingCode = this.vfs.readFile(primaryFile) || '';

        try {
          this.log(task.role, `Generating implementation for ${task.title}...`, 'tool_call');

          const codeGen = await GeminiService.generateCode({
            taskTitle: task.title,
            taskDetails: task.description,
            filePath: primaryFile,
            currentCode: existingCode,
            projectContext: this.currentPlan.goal,
            agentRole: task.role,
          });

          // 3. EXECUTE: Write file
          const writeRes = await this.toolRegistry.executeTool('write_file', {
            filePath: primaryFile,
            content: codeGen.code,
          }, task.id);

          filesModifiedGlobally.add(primaryFile);

          this.recordStep(task, {
            id: `step-write-${Date.now()}`,
            stepIndex: ++stepCount,
            tool: 'write_file',
            args: { filePath: primaryFile },
            result: writeRes,
            rationale: `Apply coordinated edits to ${primaryFile}`,
            observation: writeRes.output || 'Saved to disk and VFS.',
            timestamp: Date.now(),
          });

          // Write generated unit test if provided
          if (codeGen.tests) {
            const testPath = primaryFile.replace('src/', 'src/__tests__/').replace('.tsx', '.test.ts').replace('.ts', '.test.ts');
            await this.toolRegistry.executeTool('write_file', {
              filePath: testPath,
              content: codeGen.tests,
            }, task.id);
            filesModifiedGlobally.add(testPath);
          }

          // 4. OBSERVE & DIAGNOSE: Type check
          this.log(task.role, 'Running diagnostics & type check...', 'info');
          const typeCheckRes = await this.toolRegistry.executeTool('type_check', {}, task.id);
          commandsExecutedGlobally.push({
            command: 'npm run lint',
            exitCode: typeCheckRes.success ? 0 : 1,
            success: typeCheckRes.success,
          });

          this.recordStep(task, {
            id: `step-typecheck-${Date.now()}`,
            stepIndex: ++stepCount,
            tool: 'type_check',
            args: {},
            result: typeCheckRes,
            rationale: 'Verify type soundness and syntax cleanliness',
            observation: typeCheckRes.output || '',
            diagnosis: !typeCheckRes.success ? typeCheckRes.error : undefined,
            timestamp: Date.now(),
          });

          if (typeCheckRes.success) {
            taskSuccess = true;
            task.resultSummary = codeGen.explanation || `Successfully implemented ${task.title}.`;
          } else {
            task.retryCount++;
            this.log(task.role, `Type-check failed (${task.retryCount}/${task.maxRetries}). Attempting self-healing correction...`, 'warning');
            if (task.retryCount > task.maxRetries) {
              task.status = 'failed';
              task.error = `Exceeded max retry attempts (${task.maxRetries}). Last error: ${typeCheckRes.error}`;
              break;
            }
          }
        } catch (genErr: unknown) {
          task.retryCount++;
          const msg = genErr instanceof Error ? genErr.message : String(genErr);
          this.log(task.role, `Code generation error: ${msg}`, 'error');
          if (task.retryCount > task.maxRetries) {
            task.status = 'failed';
            task.error = msg;
            break;
          }
        }
      }

      if (taskSuccess) {
        task.status = 'completed';
        this.notifyTaskStatus(task.id, 'completed');
        this.log(task.role, `Task completed and verified: "${task.title}"`, 'success');
      } else if (task.status !== 'failed') {
        task.status = 'failed';
        task.error = 'Step budget exceeded without meeting acceptance criteria.';
        this.notifyTaskStatus(task.id, 'failed');
        this.log(task.role, `Task failed: ${task.error}`, 'error');
      }
    }

    // ==========================================
    // STAGE 8 & 9: VERIFICATION & SUMMARIZE
    // ==========================================
    this.setExecutionState('verifying');
    this.log('Testing', 'Running project-wide verification suite...', 'info');

    const verification = await AutonomousVerificationService.runVerification(
      this.toolRegistry,
      filesModifiedGlobally,
      commandsExecutedGlobally
    );

    if (this.currentPlan) {
      this.currentPlan.status = verification.overallSuccess ? 'completed' : 'failed';
    }

    this.setExecutionState(verification.overallSuccess ? 'completed' : 'failed');
    if (this.events.onVerificationComplete) {
      this.events.onVerificationComplete(verification);
    }

    this.log(
      'Reviewer',
      `Verification complete: ${verification.filesChanged.length} files changed, ${verification.testsPassed} tests passed, type-check: ${verification.typeCheckPassed ? 'PASSED' : 'FAILED'}.`,
      verification.overallSuccess ? 'success' : 'warning'
    );

    return verification;
  }

  private recordStep(task: AutonomousTask, step: StepExecutionRecord) {
    task.executionHistory.push(step);
    if (this.events.onStepExecuted) {
      this.events.onStepExecuted(task.id, step);
    }
  }

  private notifyTaskStatus(taskId: string, status: AutonomousTask['status']) {
    if (this.events.onTaskStatusChange) {
      this.events.onTaskStatusChange(taskId, status);
    }
  }
}
