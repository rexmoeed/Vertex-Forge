import { AgentRole } from '../../types/ide';
import {
  AutonomousPlan,
  AutonomousTask,
  PermissionMode,
} from '../../types/autonomousAgent';
import { VirtualFileSystem } from '../virtualFs';
import { AgentToolRegistry } from '../agentToolRegistry';
import { GeminiService } from '../geminiService';
import { logger } from '../logger';

export class AutonomousPlanGenerator {
  public static async planGoal(
    userGoal: string,
    vfs: VirtualFileSystem,
    toolRegistry: AgentToolRegistry,
    permissionMode: PermissionMode,
    maxRetriesPerTask: number
  ): Promise<AutonomousPlan> {
    // 1. Inspect Workspace Stack & Manifests
    let packageJsonRaw = vfs.readFile('package.json');
    if (!packageJsonRaw) {
      const readRes = await toolRegistry.executeTool('read_file', { filePath: 'package.json' });
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
      } catch {
        // use fallback stack
      }
    }

    // 2. Synthesize Tasks via Gemini or Deterministic Fallback
    const planId = `plan-${Date.now()}`;
    let generatedTasks: AutonomousTask[] = [];

    try {
      const aiPlan = await GeminiService.planProject({
        goal: userGoal,
        currentStack: stackSummary,
        filesSummary: vfs.getTree().map(n => n.name).join(', '),
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
          requiresApproval: permissionMode === 'strict' || permissionMode === 'supervised',
          approvalStatus: 'pending',
          executionHistory: [],
          retryCount: 0,
          maxRetries: maxRetriesPerTask,
        }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn('AI Planning fallback:', { error: msg }, e);
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
          requiresApproval: permissionMode === 'strict',
          approvalStatus: 'pending',
          executionHistory: [],
          retryCount: 0,
          maxRetries: maxRetriesPerTask,
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
          maxRetries: maxRetriesPerTask,
        },
      ];
    }

    return {
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
  }
}
