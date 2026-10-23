import { useState, useCallback, useMemo, useEffect } from 'react';
import { VirtualFileSystem } from '../../services/virtualFs';
import { ProjectProfile } from '../../types/project';
import { AgentContextType } from '../AgentContext';
import { UIContextType } from '../UIContext';
import { GitContextType } from '../GitContext';
import { CodebaseIndexer } from '../../services/codebaseIndexer';
import { AIProjectNavigator } from '../../services/aiNavigator';
import { DesktopBridge } from '../../services/desktopBridge';
import { AutonomousAgentEngine } from '../../services/autonomousAgentEngine';
import { IDEBuildRunner } from '../../services/ideBuildRunner';
import { PermissionMode } from '../../types/autonomousAgent';
import { ProposedFileChange, InspectionResult } from '../../types/desktop';
import { AICodeReviewResponse, GeminiService } from '../../services/geminiService';
import { TaskItem, TestResult, ProblemDiagnostic, OpenTab } from '../../types/ide';

export interface UseIDEAutonomousEngineProps {
  vfs: VirtualFileSystem;
  projectProfile: ProjectProfile | null;
  agent: AgentContextType;
  ui: UIContextType;
  git: GitContextType;
  activeFile: string | null;
  activeFileContent: string;
  setActiveFileContent: (c: string) => void;
  openTabs: OpenTab[];
  testResults: TestResult[];
  problems: ProblemDiagnostic[];
  runTests: (activeFile?: string | null, onLog?: any) => Promise<void>;
}

export function useIDEAutonomousEngine({
  vfs,
  projectProfile,
  agent,
  ui,
  git,
  activeFile,
  activeFileContent,
  setActiveFileContent,
  openTabs,
  testResults,
  problems,
  runTests,
}: UseIDEAutonomousEngineProps) {
  const [indexer, setIndexer] = useState<CodebaseIndexer>(() => new CodebaseIndexer(vfs));
  const [navigator, setNavigator] = useState<AIProjectNavigator>(() => new AIProjectNavigator(vfs, indexer));
  const [proposedChanges, setProposedChanges] = useState<ProposedFileChange[]>([]);
  const [lastInspectionResult, setLastInspectionResult] = useState<InspectionResult | null>(null);
  const [codeReviewResult, setCodeReviewResult] = useState<AICodeReviewResponse | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    GeminiService.checkHealth?.()
      .then(res => {
        if (res && typeof res.hasApiKey === 'boolean') {
          setHasApiKey(res.hasApiKey);
        }
      })
      .catch(() => {});
  }, []);

  const autonomousEngine = useMemo(() => {
    const permissionMode: PermissionMode = agent.autonomyMode === 'autonomous' ? 'autonomous' : 'supervised';
    const engine = new AutonomousAgentEngine(vfs, permissionMode, projectProfile || undefined);
    engine.setEvents({
      onPlanCreated: plan => {
        agent.setAutonomousPlan(plan);
        const mappedTasks: TaskItem[] = plan.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          agent: t.role,
          status: t.status === 'running' ? 'in-progress' : t.status as TaskItem['status'],
          targetFile: t.targetFiles[0] || 'src/App.tsx',
          toolAction: 'modify_file',
          requiresApproval: t.requiresApproval,
          approvalStatus: t.approvalStatus,
          resultSummary: t.resultSummary,
          verificationEvidence: t.verificationReport ? 'Verified' : undefined,
        }));
        agent.setTaskPlan(mappedTasks);
      },
      onPlanStatusChange: status => {
        if (status === 'in_progress') agent.setOrchestratorStatus('executing');
        else if (status === 'completed') agent.setOrchestratorStatus('completed');
        else if (status === 'rejected' || status === 'cancelled') agent.setOrchestratorStatus('idle');
        else if (status === 'failed') agent.setOrchestratorStatus('error');
      },
      onTaskStatusChange: (taskId, status) => {
        agent.setTaskPlan(prev => prev.map(t => t.id === taskId ? { ...t, status: status === 'running' ? 'in-progress' : status as TaskItem['status'] } : t));
      },
      onExecutionStateChange: state => {
        agent.setAutonomousExecutionState(state);
        if (state === 'executing') agent.setOrchestratorStatus('executing');
        else if (state === 'planning') agent.setOrchestratorStatus('planning');
        else if (state === 'waiting_plan_approval' || state === 'waiting_step_approval') agent.setOrchestratorStatus('awaiting_approval');
        else if (state === 'verifying') agent.setOrchestratorStatus('testing');
        else if (state === 'completed') agent.setOrchestratorStatus('completed');
        else if (state === 'failed') agent.setOrchestratorStatus('error');
        else if (state === 'cancelled' || state === 'idle') agent.setOrchestratorStatus('idle');
      },
      onVerificationComplete: summary => {
        agent.setVerificationSummary(summary);
      },


    });
    return engine;
  }, [vfs, agent, projectProfile, git]);

  const startAutonomousPlan = useCallback(async (userPrompt: string) => {
    try {
      agent.setOrchestratorStatus('planning');
      agent.setActiveAgent('Architect');
      agent.setVerificationSummary(null);
      agent.logAgentAction('Architect', `Analyzing requirements: "${userPrompt}"`, 'info');

      const plan = await autonomousEngine.planGoal(userPrompt);
      agent.setAutonomousPlan(plan);

      if (plan.status === 'approved') {
        const summary = await autonomousEngine.executePlan();
        agent.setVerificationSummary(summary);
        await git.refreshGit();
      }
    } catch (err: any) {
      agent.logAgentAction('Architect', `Planning failed: ${err.message}`, 'error');
      agent.setOrchestratorStatus('error');
    }
  }, [agent, autonomousEngine, git]);

  const pauseAutonomousPlan = useCallback(() => {
    autonomousEngine.pause();
  }, [autonomousEngine]);

  const resumeAutonomousPlan = useCallback(() => {
    autonomousEngine.resume();
  }, [autonomousEngine]);

  const cancelAutonomousPlan = useCallback(() => {
    autonomousEngine.cancel();
  }, [autonomousEngine]);

  const approveAutonomousPlan = useCallback(async () => {
    await autonomousEngine.approvePlan();
    git.refreshGit();
  }, [autonomousEngine, git]);

  const rejectAutonomousPlan = useCallback(() => {
    autonomousEngine.rejectPlan();
  }, [autonomousEngine]);

  const rollbackAutonomousPlan = useCallback(async (cp?: string): Promise<boolean> => {
    const res = await autonomousEngine.rollback(cp);
    return res.success;
  }, [autonomousEngine]);

  const retryAutonomousTask = useCallback(async (id: string) => {
    await autonomousEngine.retryTask(id);
    await git.refreshGit();
  }, [autonomousEngine, git]);

  const inspectFeature = useCallback((query: string): InspectionResult => {
    const res = navigator.explainFeature(query);
    setLastInspectionResult(res);
    return res;
  }, [navigator]);

  const proposeMultiFileChanges = useCallback((instruction: string) => {
    const changes: ProposedFileChange[] = [
      {
        id: `prop-${Date.now()}-1`,
        filePath: activeFile || 'src/App.tsx',
        originalContent: activeFileContent,
        newContent: `${activeFileContent}\n// Applied: ${instruction}\n`,
        action: 'modify',
        additions: 1,
        deletions: 0,
        riskLevel: 'low',
        explanation: `Proposed changes based on instruction: ${instruction}`,
        accepted: true,
      },
    ];
    setProposedChanges(changes);
    ui.setIsMultiFileReviewOpen(true);
  }, [activeFile, activeFileContent, ui]);

  const applySelectedChanges = useCallback((acceptedChanges: ProposedFileChange[]) => {
    for (const change of acceptedChanges) {
      vfs.writeFile(change.filePath, change.newContent);
      DesktopBridge.writeFile(change.filePath, change.newContent);
    }
    if (activeFile) {
      const c = vfs.readFile(activeFile);
      if (c) setActiveFileContent(c);
    }
    setProposedChanges([]);
    ui.setIsMultiFileReviewOpen(false);
  }, [vfs, activeFile, ui, setActiveFileContent]);

  const triggerSelfHealDebug = useCallback(async (errorDetails?: string) => {
    agent.setOrchestratorStatus('self_correcting');
    agent.setActiveAgent('Debugger');
    ui.setBottomPanelTab('terminal');
    ui.setIsBottomPanelOpen(true);

    const failingSuite = testResults.find(t => t.status === 'failed') ||
      (problems.length > 0 ? { filePath: problems[0].filePath, errorStack: problems[0].message } : null) ||
      (openTabs.length > 0 ? { filePath: openTabs[0].filePath, errorStack: 'Issue detected' } : null);

    if (!failingSuite) {
      agent.setOrchestratorStatus('idle');
      return;
    }

    const res = await IDEBuildRunner.executeSelfHeal({
      failingFile: failingSuite.filePath,
      errorStack: errorDetails || failingSuite.errorStack || 'Error',
      vfs,
      onLog: agent.logAgentAction,
    });

    if (res.success && res.patch && activeFile === failingSuite.filePath) {
      setActiveFileContent(res.patch);
    }
    await runTests(activeFile, agent.logAgentAction);
    agent.setOrchestratorStatus('idle');
  }, [agent, ui, testResults, problems, openTabs, vfs, activeFile, runTests, setActiveFileContent]);

  const runSecurityReview = useCallback(async () => {
    agent.setActiveAgent('Reviewer');
    ui.setBottomPanelTab('security');
    ui.setIsBottomPanelOpen(true);
    await IDEBuildRunner.runSecurityReview(agent.logAgentAction);
  }, [agent, ui]);

  return {
    indexer,
    setIndexer,
    navigator,
    setNavigator,
    proposedChanges,
    setProposedChanges,
    lastInspectionResult,
    inspectFeature,
    proposeMultiFileChanges,
    applySelectedChanges,
    hasApiKey,
    autonomousEngine,
    startAutonomousPlan,
    pauseAutonomousPlan,
    resumeAutonomousPlan,
    cancelAutonomousPlan,
    approveAutonomousPlan,
    rejectAutonomousPlan,
    rollbackAutonomousPlan,
    retryAutonomousTask,
    triggerSelfHealDebug,
    runSecurityReview,
    codeReviewResult,
    setCodeReviewResult,
  };
}
