import { AgentRole } from '../types/ide';
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
  ToolName,
} from '../types/autonomousAgent';
import { AgentToolRegistry } from './agentToolRegistry';
import { VirtualFileSystem } from './virtualFs';
import { GeminiService } from './geminiService';
import { AIProviderService } from './aiProviderService';
import { UniversalSystemPromptBuilder } from './universalSystemPrompt';
import { ProjectProfile } from '../types/project';
import { logger } from './logger';

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

    // 1. Inspect Workspace Stack & Manifests
    let packageJsonRaw = this.vfs.readFile('package.json');
    if (!packageJsonRaw) {
      const readRes = await this.toolRegistry.executeTool('read_file', { filePath: 'package.json' });
      if (readRes.success && readRes.data?.content) {
        packageJsonRaw = readRes.data.content;
      }
    }

    let stackSummary = 'React + TypeScript + Vite';
    if (packageJsonRaw) {
      try {
        const pkg = JSON.parse(packageJsonRaw);
        const deps = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}));
        stackSummary = `${pkg.name || 'Application'} [${deps.slice(0, 6).join(', ')}]`;
      } catch {}
    }

    // 2. Synthesize Tasks via Gemini or Deterministic Fallback
    const planId = `plan-${Date.now()}`;
    let generatedTasks: AutonomousTask[] = [];

    try {
      const aiPlan = await GeminiService.planProject({
        goal: userGoal,
        currentStack: stackSummary,
        filesSummary: this.vfs.getTree().map(n => n.name).join(', '),
      });

      if (aiPlan.tasks && aiPlan.tasks.length > 0) {
        generatedTasks = aiPlan.tasks.map((t, idx) => ({
          id: t.id || `task-${idx + 1}`,
          title: t.title,
          description: t.description,
          role: ((t as Record<string, string>).agent || (idx === 0 ? 'Architect' : 'Developer')) as AgentRole,
          status: 'pending',
          dependencies: idx > 0 ? [`task-${idx}`] : [],
          acceptanceCriteria: [
            `Implement changes for ${t.title}`,
            `Zero syntax/type check errors`,
            `File saved and verified on disk`,
          ],
          estimatedTools: ['read_file', 'write_file', 'type_check', 'run_tests'],
          targetFiles: [t.targetFile || 'src/App.tsx'],
          requiresApproval: this.permissionMode === 'strict' || this.permissionMode === 'supervised',
          approvalStatus: 'pending',
          executionHistory: [],
          retryCount: 0,
          maxRetries: this.maxRetriesPerTask,
        }));
      }
    } catch (e: any) {
      logger.warn('AI Planning fallback:', e?.message);
    }

    // Fallback if AI plan returned empty
    if (generatedTasks.length === 0) {
      generatedTasks = [
        {
          id: 'task-1',
          title: `Investigate and implement: ${userGoal.slice(0, 40)}`,
          description: `Analyze current codebase files, make requested modifications, and verify type soundness.`,
          role: 'Developer',
          status: 'pending',
          dependencies: [],
          acceptanceCriteria: [
            `Verify workspace imports`,
            `Apply edits without regression`,
            `Pass type checks`,
          ],
          estimatedTools: ['file_search', 'read_file', 'write_file', 'type_check'],
          targetFiles: ['src/App.tsx'],
          requiresApproval: this.permissionMode === 'strict',
          approvalStatus: 'pending',
          executionHistory: [],
          retryCount: 0,
          maxRetries: this.maxRetriesPerTask,
        },
        {
          id: 'task-2',
          title: 'Automated Verification & Diagnostics',
          description: 'Run project type-checks and test assertions to verify zero errors.',
          role: 'Testing',
          status: 'pending',
          dependencies: ['task-1'],
          acceptanceCriteria: ['Pass test suite', 'Pass lint checks'],
          estimatedTools: ['type_check', 'run_tests'],
          targetFiles: [],
          requiresApproval: false,
          approvalStatus: 'approved',
          executionHistory: [],
          retryCount: 0,
          maxRetries: this.maxRetriesPerTask,
        },
      ];
    }

    const plan: AutonomousPlan = {
      id: planId,
      goal: userGoal,
      techStackSummary: stackSummary,
      rootWorkspace: '.',
      tasks: generatedTasks,
      suggestedTools: ['read_file', 'write_file', 'patch_file', 'type_check', 'run_tests'],
      estimatedTotalSteps: generatedTasks.length * 3,
      createdAt: Date.now(),
      status: 'draft',
    };

    this.currentPlan = plan;
    if (this.events.onPlanCreated) {
      this.events.onPlanCreated(plan);
    }

    // Permission Check: If strict or supervised mode, pause for user review
    if (this.permissionMode === 'strict' || this.permissionMode === 'supervised') {
      this.setExecutionState('waiting_plan_approval');
      this.log('Architect', `Plan generated with ${plan.tasks.length} tasks. Waiting for human approval.`, 'info');
    } else {
      // In autonomous mode, auto-approve and start
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
        return this.createEmptyVerification();
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
        return this.createEmptyVerification();
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
            // DIAGNOSE & CORRECT
            task.retryCount++;
            this.log(task.role, `Type-check failed (${task.retryCount}/${task.maxRetries}). Attempting self-healing correction...`, 'warning');
            if (task.retryCount > task.maxRetries) {
              task.status = 'failed';
              task.error = `Exceeded max retry attempts (${task.maxRetries}). Last error: ${typeCheckRes.error}`;
              break;
            }
          }
        } catch (genErr: any) {
          task.retryCount++;
          this.log(task.role, `Code generation error: ${genErr?.message}`, 'error');
          if (task.retryCount > task.maxRetries) {
            task.status = 'failed';
            task.error = genErr?.message;
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

    // 1. Project Type Check
    const finalLint = await this.toolRegistry.executeTool('type_check', {});
    // 2. Project Unit Tests
    const finalTests = await this.toolRegistry.executeTool('run_tests', {});

    commandsExecutedGlobally.push({
      command: 'npm test',
      exitCode: finalTests.success ? 0 : 1,
      success: finalTests.success,
    });

    const verification: VerificationSummary = {
      filesChanged: Array.from(filesModifiedGlobally),
      commandsExecuted: commandsExecutedGlobally,
      testsPassed: finalTests.data?.passed || (finalTests.success ? 1 : 0),
      testsFailed: finalTests.data?.failed || (!finalTests.success ? 1 : 0),
      testErrors: finalTests.error ? [finalTests.error] : [],
      typeCheckPassed: finalLint.success,
      typeCheckErrors: finalLint.error ? [finalLint.error] : [],
      checksNotRun: ['Full browser visual regression', 'Cloud deployment check'],
      remainingRisks: finalTests.success && finalLint.success
        ? []
        : ['Some assertions or type rules need manual confirmation'],
      overallSuccess: finalLint.success && finalTests.success,
      timestamp: Date.now(),
    };

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

  private createEmptyVerification(): VerificationSummary {
    return {
      filesChanged: [],
      commandsExecuted: [],
      testsPassed: 0,
      testsFailed: 0,
      typeCheckPassed: true,
      checksNotRun: [],
      remainingRisks: [],
      overallSuccess: false,
      timestamp: Date.now(),
    };
  }
}
