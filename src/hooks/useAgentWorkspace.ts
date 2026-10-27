import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentHierarchyService } from '../services/agentHierarchyService';
import {
  SpecialistLeadInfo,
  SubAgentTaskContract,
  CompletionReport,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
} from '../types/agentHierarchy';
import { AgentArtifactTabId } from '../components/views/agent/AgentDeliverablesPanel';
import { VirtualFileSystem } from '../services/virtualFs';
import { ProjectProfile } from '../types/project';
import { logger } from '../services/logger';

export function useAgentWorkspace(vfs?: VirtualFileSystem, activeProject?: any) {
  const [autonomousInput, setAutonomousInput] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [showWorkspaceToolActivity, setShowWorkspaceToolActivity] = useState(false);

  const [hierarchyService] = useState<AgentHierarchyService>(() => new AgentHierarchyService(vfs));
  const [leads, setLeads] = useState<SpecialistLeadInfo[]>(() => hierarchyService.getLeads());
  const [tasks, setTasks] = useState<SubAgentTaskContract[]>(() => hierarchyService.getTasks());
  const [reports, setReports] = useState<CompletionReport[]>(() => hierarchyService.getCompletionReports());
  const [messages, setMessages] = useState(() => hierarchyService.getMessages());
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SpecialistLeadInfo | null>(leads[0] || null);
  const [activeArtifactTab, setActiveArtifactTab] = useState<AgentArtifactTabId>('brief');

  // Dynamic Project Decomposition & Parallel Tasking states
  const [projectGoalInput, setProjectGoalInput] = useState('');
  const [parallelConcurrency, setParallelConcurrency] = useState<number>(() => hierarchyService.getParallelConcurrency());
  const [isParallelRunning, setIsParallelRunning] = useState<boolean>(() => hierarchyService.isParallelRunning());
  const [activeParallelSubAgents, setActiveParallelSubAgents] = useState<ParallelSubAgentActiveInfo[]>(() => hierarchyService.getActiveParallelSubAgents());
  const [parallelProgress, setParallelProgress] = useState<ParallelProgressInfo>(() => hierarchyService.getParallelProgress());

  useEffect(() => {
    hierarchyService.setUpdateListener(() => {
      setLeads(hierarchyService.getLeads());
      setTasks(hierarchyService.getTasks());
      setReports(hierarchyService.getCompletionReports());
      setMessages([...hierarchyService.getMessages()]);
      setIsParallelRunning(hierarchyService.isParallelRunning());
      setActiveParallelSubAgents(hierarchyService.getActiveParallelSubAgents());
      setParallelProgress(hierarchyService.getParallelProgress());
    });
  }, [hierarchyService]);

  const handleDecomposeProject = useCallback((customGoal?: string) => {
    const goal = customGoal !== undefined ? customGoal : projectGoalInput;
    hierarchyService.decomposeProjectIntoSubTasks(activeProject, goal);
    setTasks(hierarchyService.getTasks());
    setActiveArtifactTab('contracts');
  }, [activeProject, projectGoalInput, hierarchyService]);

  const handleRunParallelSubAgents = useCallback(async () => {
    const currentTasks = hierarchyService.getTasks();
    if (currentTasks.length === 0 || currentTasks.every(t => t.status === 'completed')) {
      handleDecomposeProject();
    }
    hierarchyService.setParallelConcurrency(parallelConcurrency);
    try {
      await hierarchyService.executeAllTasksParallel({
        concurrency: parallelConcurrency,
      });
    } catch (err: any) {
      logger.error('Parallel execution error:', err);
    }
  }, [hierarchyService, parallelConcurrency, handleDecomposeProject]);

  const handleCancelParallel = useCallback(() => {
    hierarchyService.cancelParallelExecution();
  }, [hierarchyService]);

  const handleResetTasks = useCallback(() => {
    hierarchyService.resetAllTasks();
  }, [hierarchyService]);

  const handleRunFullTeamBenchmark = useCallback(async () => {
    setIsOrchestrating(true);
    try {
      await hierarchyService.orchestrateFullTeamBenchmark(true);
    } catch (err: any) {
      logger.error('Benchmark error:', err);
    } finally {
      setIsOrchestrating(false);
    }
  }, [hierarchyService]);

  const totalQualityGates = useMemo(
    () => leads.reduce((acc, l) => acc + l.qualityGatesPassed, 0),
    [leads]
  );

  return {
    hierarchyService,
    leads,
    tasks,
    reports,
    messages,
    isOrchestrating,
    selectedLead,
    setSelectedLead,
    activeArtifactTab,
    setActiveArtifactTab,
    autonomousInput,
    setAutonomousInput,
    isLaunching,
    setIsLaunching,
    showWorkspaceToolActivity,
    setShowWorkspaceToolActivity,
    projectGoalInput,
    setProjectGoalInput,
    parallelConcurrency,
    setParallelConcurrency,
    isParallelRunning,
    activeParallelSubAgents,
    parallelProgress,
    totalQualityGates,
    handleDecomposeProject,
    handleRunParallelSubAgents,
    handleCancelParallel,
    handleResetTasks,
    handleRunFullTeamBenchmark,
  };
}
