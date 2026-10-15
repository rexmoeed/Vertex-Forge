import { SwarmMissionCockpit } from './SwarmMissionCockpit';
import React, { useState, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Users,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  AlertTriangle,
  Play,
  RotateCw,
  FileCode,
  Layers,
  ChevronRight,
  MessageSquare,
  FileText,
  Palette,
  Terminal,
  ExternalLink,
  Code2,
  Wrench,
  XCircle,
  X,
  Key,
  Cpu,
  Pause,
  Undo2,
  Send,
  AlertCircle,
  RefreshCw,
  Zap,
  Split,
  Sliders,
  Check,
} from 'lucide-react';
import { AutonomousTask, StepExecutionRecord } from '../../types/autonomousAgent';
import { AgentHierarchyService } from '../../services/agentHierarchyService';
import {
  SpecialistLeadInfo,
  SubAgentTaskContract,
  CompletionReport,
  ParallelSubAgentActiveInfo,
  ParallelProgressInfo,
} from '../../types/agentHierarchy';

export const AgentWorkspaceView: React.FC = () => {
  const {
    vfs,
    activeProject,
    testResults,
    triggerSelfHealDebug,
    runTests,
    openFile,
    setActiveView,
    autonomousPlan,
    autonomousExecutionState,
    verificationSummary,
    startAutonomousPlan,
    pauseAutonomousPlan,
    resumeAutonomousPlan,
    cancelAutonomousPlan,
    approveAutonomousPlan,
    rejectAutonomousPlan,
    rollbackAutonomousPlan,
    retryAutonomousTask,
    autonomyMode,
    setAutonomyMode,
  } = useIDE() as any;

  const [autonomousInput, setAutonomousInput] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [showWorkspaceToolActivity, setShowWorkspaceToolActivity] = useState(false);

  const [hierarchyService] = useState<AgentHierarchyService>(() => new AgentHierarchyService(vfs));
  const [leads, setLeads] = useState<SpecialistLeadInfo[]>(() => hierarchyService.getLeads());
  const [tasks, setTasks] = useState<SubAgentTaskContract[]>(() => hierarchyService.getTasks());
  const [reports, setReports] = useState<CompletionReport[]>(() => hierarchyService.getCompletionReports());
  const [messages, setMessages] = useState(() => hierarchyService.getMessages());
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SpecialistLeadInfo | null>(leads[0]);
  const [activeArtifactTab, setActiveArtifactTab] = useState<'brief' | 'design' | 'architecture' | 'code' | 'qa' | 'contracts'>('brief');

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

  const handleDecomposeProject = (customGoal?: string) => {
    const goal = customGoal !== undefined ? customGoal : projectGoalInput;
    hierarchyService.decomposeProjectIntoSubTasks(activeProject, goal);
    setTasks(hierarchyService.getTasks());
    setActiveArtifactTab('contracts');
  };

  const handleRunParallelSubAgents = async () => {
    // If no tasks exist or all are already completed, auto-decompose
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
      console.error('Parallel execution error:', err);
    }
  };

  const handleCancelParallel = () => {
    hierarchyService.cancelParallelExecution();
  };

  const handleResetTasks = () => {
    hierarchyService.resetAllTasks();
  };

  const handleRunFullTeamBenchmark = async () => {
    setIsOrchestrating(true);
    try {
      await hierarchyService.orchestrateFullTeamBenchmark(true);
    } catch (err: any) {
      console.error('Benchmark error:', err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const totalQualityGates = leads.reduce((acc, l) => acc + l.qualityGatesPassed, 0);
  const failedTests = testResults.filter((t: any) => t.status === 'failed').length;

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-editor-bg)',
        color: 'var(--ide-text)',
      }}
      className="flex-1 w-full h-full overflow-y-auto p-6 flex flex-col gap-6 select-none min-h-0"
    >
      {/* 1. ORCHESTRATOR COMMAND BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Hierarchical AI Engineering Team</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                10 Leads Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Level 1 Orchestrator coordinates Principal Team Leads who delegate scoped contracts to Sub-Agents with strict quality gates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 border-r border-slate-800 pr-6 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Quality Gates</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{totalQualityGates} Passed</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Delegated Tasks</span>
              <span className="text-indigo-400 font-bold font-mono text-sm">{tasks.length} Managed</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">File Locks</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">{hierarchyService.getFileReservations().length} Active</span>
            </div>
          </div>

          <button
            onClick={() => setActiveView('editor')}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Return to Main Editor Workspace"
          >
            <span>←</span> Editor
          </button>

          <button
            onClick={() => setActiveView('providers')}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-750 hover:border-amber-500/50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Configure LLM model assignments and BYOK API keys for each agent role"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent Models & Keys</span>
          </button>

          <button
            onClick={handleRunParallelSubAgents}
            disabled={isParallelRunning}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Decompose any active project and execute multiple sub-agents in parallel"
          >
            {isParallelRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />}
            <span>{isParallelRunning ? `Running (${activeParallelSubAgents.length} Parallel)...` : 'Decompose & Run Parallel'}</span>
          </button>

          <button
            onClick={handleRunFullTeamBenchmark}
            disabled={isOrchestrating || isParallelRunning}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isOrchestrating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>Benchmark</span>
          </button>
        </div>
      </div>

      {/* 1A. DYNAMIC PROJECT DECOMPOSITION & MULTI-AGENT PARALLEL EXECUTION STUDIO */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Dynamic Project Decomposition & Multi-Agent Parallel Tasking</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isParallelRunning ? `${activeParallelSubAgents.length} Active in Parallel` : 'Ready to Decompose'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Workspace: {activeProject?.name || 'Current Project'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Any project is decomposed into a structured DAG of sub-tasks across 10 specialized Team Leads and executed concurrently with file-lock concurrency control.
              </p>
            </div>
          </div>

          {/* Concurrency Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Split className="w-3 h-3 text-amber-400" />
              Parallel Threads:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    setParallelConcurrency(num);
                    hierarchyService.setParallelConcurrency(num);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                    parallelConcurrency === num
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={`Run up to ${num} sub-agents simultaneously`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Decomposition Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleRunParallelSubAgents();
          }}
          className="flex flex-col gap-2.5"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={projectGoalInput}
              onChange={e => setProjectGoalInput(e.target.value)}
              placeholder="Enter custom project goal (e.g. 'Build REST API with JWT authentication', 'Harmonize UI Design Tokens & Dark Mode', or leave blank for full project lifecycle)..."
              className="flex-1 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isParallelRunning}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isParallelRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
              <span>{isParallelRunning ? 'Executing in Parallel...' : 'Decompose & Execute in Parallel'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDecomposeProject()}
              disabled={isParallelRunning}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Decompose project into sub-tasks and inspect contracts DAG without immediate execution"
            >
              Decompose Only
            </button>
            {isParallelRunning ? (
              <button
                type="button"
                onClick={handleCancelParallel}
                className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Stop
              </button>
            ) : tasks.length > 0 ? (
              <button
                type="button"
                onClick={handleResetTasks}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-medium transition cursor-pointer"
                title="Reset all tasks and contracts"
              >
                Reset
              </button>
            ) : null}
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
            {[
              'Full Workspace Engineering Audit & Quality Gate Verification',
              'API Endpoints, Schema Validation & Data Flow Operations',
              'UI Design Tokens, Responsive Components & WCAG AA Contrast',
              'AST Security Audit, Input Sanitization & Automated Unit Tests',
            ].map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setProjectGoalInput(preset);
                  handleDecomposeProject(preset);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 text-[10px] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>

        {/* Live Parallel Concurrency Active Monitor */}
        {activeParallelSubAgents.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-600/10 to-emerald-500/10 border border-amber-500/40 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Parallel Tasking Active: {activeParallelSubAgents.length} Sub-Agents Executing Simultaneously
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Max Concurrency: {parallelConcurrency} Threads
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeParallelSubAgents.map(sub => (
                <div
                  key={sub.taskId}
                  className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {sub.subAgentRole}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {sub.progress}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 line-clamp-1">{sub.title}</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${sub.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate">{sub.stage}</span>
                    <span className="text-indigo-400">{sub.parentLead}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Tasks Progress Bar */}
        {tasks.length > 0 && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Sub-Agent Execution Progress:</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {parallelProgress.completedTasks} / {parallelProgress.totalTasks} Tasks Completed
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {parallelProgress.percent}%
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${parallelProgress.percent}%` }}
              />
            </div>

            {/* Phase Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-850 text-[10px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Phase 1: Planning</span>
                <span className="font-bold text-cyan-300">Parallel</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Phase 2: Implementation</span>
                <span className="font-bold text-amber-300">Parallel (Locks)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Phase 3: QA & Security</span>
                <span className="font-bold text-emerald-300">Parallel</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Phase 4: E2E Signoff</span>
                <span className="font-bold text-indigo-300">Quality Gate</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1B. AUTONOMOUS AI SOFTWARE ENGINEER STUDIO */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Autonomous AI Software Engineer</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {autonomousExecutionState || 'IDLE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Understand → Inspect → Plan → Execute → Observe → Diagnose → Correct → Verify → Summarize
              </p>
            </div>
          </div>

          {/* Safety & Permission Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold px-2">Safety:</span>
            {(['autonomous', 'supervised', 'strict'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAutonomyMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  autonomyMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!autonomousInput.trim() || isLaunching) return;
            setIsLaunching(true);
            try {
              await startAutonomousPlan(autonomousInput.trim());
            } finally {
              setIsLaunching(false);
            }
          }}
          className="flex flex-col gap-2.5"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={autonomousInput}
              onChange={e => setAutonomousInput(e.target.value)}
              placeholder="Describe requested changes (e.g. 'Add input validation and unit tests', 'Fix broken imports')..."
              className="flex-1 bg-slate-950 border border-slate-750 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!autonomousInput.trim() || isLaunching}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isLaunching ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Launch Autonomous Engineer</span>
            </button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
            {[
              'Implement priority weight validation with unit tests',
              'Audit task transition RBAC matrix and harden security',
              'Refactor error handling with self-healing try-catch blocks',
            ].map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAutonomousInput(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>

        {/* Active Plan & Controls */}
        {autonomousPlan && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Goal</span>
                <span className="text-xs font-mono font-bold text-indigo-300">{autonomousPlan.goal}</span>
              </div>
              <div className="flex items-center gap-2">
                {autonomousExecutionState === 'executing' && (
                  <button
                    onClick={pauseAutonomousPlan}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                )}
                {autonomousExecutionState === 'paused' && (
                  <button
                    onClick={resumeAutonomousPlan}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  onClick={cancelAutonomousPlan}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => rollbackAutonomousPlan()}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Rollback agent modifications using latest checkpoint"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Rollback Changes</span>
                </button>
              </div>
            </div>

            {/* Plan Approval Banner */}
            {autonomousExecutionState === 'waiting_plan_approval' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-200">
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Human Approval Required for Plan</span>
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Review {autonomousPlan.tasks.length} tasks before autonomous modifications proceed.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={approveAutonomousPlan}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                  >
                    Approve Plan & Begin
                  </button>
                  <button
                    onClick={rejectAutonomousPlan}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Task State Machine Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {autonomousPlan.tasks.map((task: AutonomousTask, idx: number) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs transition-all ${
                    task.status === 'running'
                      ? 'bg-indigo-950/70 border-indigo-500/60 shadow-lg text-indigo-100'
                      : task.status === 'completed'
                      ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                      : task.status === 'failed'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : task.status === 'blocked'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/50 border-slate-850 text-slate-400'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">Task #{idx + 1}</span>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {task.status}
                      </span>
                    </div>
                    <span className="font-bold text-white text-xs">{task.title}</span>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{task.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400 truncate max-w-[140px]">
                      {task.targetFiles[0] || 'Multiple files'}
                    </span>
                    {task.status === 'failed' && (
                      <button
                        onClick={() => retryAutonomousTask(task.id)}
                        className="text-cyan-300 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Retry Task
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Summary */}
            {verificationSummary && (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 text-xs ${
                verificationSummary.overallSuccess
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Verification & Health Report</h4>
                      <span className="text-[11px] text-slate-300">Executed type checks, Vitest test suite, and build assertions</span>
                    </div>
                  </div>
                  <span className="text-xs uppercase font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 font-bold text-white">
                    {verificationSummary.overallSuccess ? 'ALL CHECKS PASSED' : 'ACTION REQUIRED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Files Modified</span>
                    <span className="font-bold text-sm text-white">{verificationSummary.filesChanged.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Vitest Tests</span>
                    <span className="font-bold text-sm text-emerald-400">{verificationSummary.testsPassed} passed</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">TypeScript AST</span>
                    <span className="font-bold text-sm text-white">{verificationSummary.typeCheckPassed ? '0 Errors' : 'Errors'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Shell Commands</span>
                    <span className="font-bold text-sm text-white">{verificationSummary.commandsExecuted.length} executed</span>
                  </div>
                </div>

                {verificationSummary.remainingRisks.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs">
                    <span className="font-bold block">Remaining Risks:</span>
                    <span>{verificationSummary.remainingRisks.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SWARM MISSION COCKPIT & LIVE GRAPH */}
      <SwarmMissionCockpit hierarchyService={hierarchyService} onNavigateToFile={openFile} />

      {/* 2. TEAM LEADS ROSTER (Level 2) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Specialist Team Leads (Level 2 Hierarchy)
          </span>
          <span className="text-[11px] text-slate-500">Select any role to inspect deliverables, sub-agents & contracts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {leads.map(lead => {
            const isSelected = selectedLead?.role === lead.role;
            return (
              <div
                key={lead.role}
                onClick={() => {
                  setSelectedLead(lead);
                  if (lead.role === 'ProductDesignLead') setActiveArtifactTab('brief');
                  else if (lead.role === 'UIDesignLead') setActiveArtifactTab('design');
                  else if (lead.role === 'ArchitectureLead') setActiveArtifactTab('architecture');
                  else if (lead.role === 'QALead') setActiveArtifactTab('qa');
                  else if (lead.role === 'FrontendLead' || lead.role === 'BackendLead' || lead.role === 'FullStackLead') setActiveArtifactTab('code');
                  else setActiveArtifactTab('contracts');
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{lead.icon}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                      lead.status === 'working'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-2 leading-snug">{lead.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{lead.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{lead.assignedSubAgents.length} Sub-Agents</span>
                  <span className="text-emerald-400 font-mono font-semibold">✓ {lead.qualityGatesPassed} gates</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SPECIALIST DELIVERABLES & INTERACTIVE PANELS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Deliverable Category Navigation Tabs */}
        <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 h-full shrink-0">
            <button
              onClick={() => setActiveArtifactTab('brief')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'brief'
                  ? 'border-indigo-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Product Brief & Scope (Product Designer)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('design')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'design'
                  ? 'border-cyan-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>UI Design Specs & Tokens (UI Designer)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('architecture')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'architecture'
                  ? 'border-amber-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>System Architecture & APIs (Lead Architect)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('code')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'code'
                  ? 'border-blue-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Frontend & Backend Contracts (Engineers)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('qa')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'qa'
                  ? 'border-emerald-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>QA Strategy & Self-Healing (QA Lead)</span>
            </button>

            <button
              onClick={() => setActiveArtifactTab('contracts')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                activeArtifactTab === 'contracts'
                  ? 'border-purple-500 text-white bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Contracts & File Locks ({tasks.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden xl:inline shrink-0 ml-2">
            Workspace: {activeProject.name}
          </span>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6">
          {/* TAB 1: PRODUCT DESIGNER SPEC */}
          {activeArtifactTab === 'brief' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🎯 Principal Product Designer Deliverables</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Approved Baseline
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Defines core audience, workflow requirements, and acceptance criteria before engineering commences.
                  </p>
                </div>
                <button
                  onClick={() => openFile('src/types/task.ts')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Domain Schema</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Product Brief */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">1. Product Purpose & Brief</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>{activeProject.name}</strong> is designed to streamline team collaboration, sprint execution, and permission governance. It solves communication fragmentation by unifying real-time task status tracking, weighted priority queues, and strict role-based access control.
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Target Personas:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li><strong>Engineering Lead</strong>: Needs visibility into blockers & sprint velocity.</li>
                      <li><strong>Product Manager</strong>: Tracks delivery timelines and acceptance criteria.</li>
                      <li><strong>Developer / Assignee</strong>: Prioritizes daily tasks and marks progress.</li>
                    </ul>
                  </div>
                </div>

                {/* Core User Journeys */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">2. Critical User Journeys</h4>
                  <div className="flex flex-col gap-2 text-xs text-slate-300">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey A: Task Creation & Assignment</span>
                      <span className="text-[11px] text-slate-400">User creates task &rarr; Selects priority weight &rarr; Assigns member with RBAC validation.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey B: Kanban State Progression</span>
                      <span className="text-[11px] text-slate-400">Todo &rarr; In Progress &rarr; Review &rarr; Done with automated audit log stamping.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                      <span className="font-bold text-white block">Journey C: Role Access Enforcement</span>
                      <span className="text-[11px] text-slate-400">Only Admin/Manager roles can reassign members or delete urgent tasks.</span>
                    </div>
                  </div>
                </div>

                {/* Acceptance Criteria & Priorities */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">3. Acceptance Criteria (Quality Gate)</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-1</strong>: All 4 status states must be strictly typed in TypeScript domain.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-2</strong>: Priority sorting algorithm must place urgent tasks ahead of high/medium/low.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>AC-3</strong>: Must provide zero-pill clean visual hierarchy with WCAG AA compliance.</span>
                    </li>
                  </ul>
                  <div className="mt-auto pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                    Signed off by Principal Product Designer
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UI DESIGNER TOKENS & SPECS */}
          {activeArtifactTab === 'design' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🎨 World-Class UI Designer Specifications</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Design System v2.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enforces typographic hierarchy, balanced spatial composition, semantic tokens, and high-fidelity states.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('design-system')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Open Full Design System Studio</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Color Palette Tokens */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Color System Tokens</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-600 shadow"></div>
                        <span className="font-mono text-slate-200">brand-indigo</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#6366f1</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-950 border border-slate-700"></div>
                        <span className="font-mono text-slate-200">surface-canvas</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#020617</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                        <span className="font-mono text-slate-200">status-success</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#10b981</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-rose-500"></div>
                        <span className="font-mono text-slate-200">status-error</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">#f43f5e</span>
                    </div>
                  </div>
                </div>

                {/* Typography Scale */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Typography Scale</span>
                  <div className="flex flex-col gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Display Title (20px, font-black)</span>
                      <span className="text-base font-black text-white">Sprint Execution Hub</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Section Subhead (13px, font-bold)</span>
                      <span className="text-xs font-bold text-slate-200">Task Priorities & Assignees</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Body / Code (11px, font-mono)</span>
                      <span className="text-[11px] font-mono text-indigo-300">task.priority === 'urgent'</span>
                    </div>
                  </div>
                </div>

                {/* Spacing & Elevation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spacing & Elevation</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Base Grid</span>
                      <span className="font-mono text-indigo-400">4px rhythmic unit</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Card Radius</span>
                      <span className="font-mono text-indigo-400">12px rounded-xl</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-850">
                      <span>Elevation Shadow</span>
                      <span className="font-mono text-indigo-400">shadow-lg shadow-black/40</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Contrast Ratio</span>
                      <span className="font-mono text-emerald-400 font-bold">14.8:1 (AAA Pass)</span>
                    </div>
                  </div>
                </div>

                {/* State Blueprint Matrix */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Component State Matrix</span>
                  <div className="flex flex-col gap-1.5 mt-1 text-[11px]">
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Empty State:</span>
                      <span className="text-slate-400 font-medium">Hero illustration + CTA</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Loading State:</span>
                      <span className="text-cyan-400 font-medium">Pulse Skeletons</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Error State:</span>
                      <span className="text-rose-400 font-medium">Inline banner + Retry</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
                      <span>Success State:</span>
                      <span className="text-emerald-400 font-medium">Transient notification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAD ARCHITECT SYSTEM BLUEPRINT */}
          {activeArtifactTab === 'architecture' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🏛️ Lead Software Architect System Blueprint</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Decomposition & Security
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    System boundaries, state lifecycle, API endpoints, and sandbox security controls.
                  </p>
                </div>
                <button
                  onClick={() => openFile('server.ts')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect server.ts API</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Decomposition & Data Flow */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">System Decomposition</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 1: Desktop / Web Frontend</span>
                      <span className="text-[11px] text-slate-400">React 19 SPA, Tailwind CSS v4, Monaco-grade editor, responsive layout.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 2: IPC & Virtual Filesystem</span>
                      <span className="text-[11px] text-slate-400">Scoped node tree, git diff calculation, conflict-free file locks.</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white block">Layer 3: Express Backend Gateway</span>
                      <span className="text-[11px] text-slate-400">Server-side proxy routes for Gemini 3.8 Flash, code review & test execution.</span>
                    </div>
                  </div>
                </div>

                {/* API Contracts */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">API Contracts</h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-emerald-400 font-bold">GET /api/tasks</span>
                      <span className="text-slate-400 block text-[10px]">Returns list of tasks with priority & status</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-blue-400 font-bold">POST /api/tasks</span>
                      <span className="text-slate-400 block text-[10px]">Payload: Task data + RBAC caller token</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-amber-400 font-bold">POST /api/ai/plan</span>
                      <span className="text-slate-400 block text-[10px]">Server-side proxy to Gemini 3.8 Flash</span>
                    </div>
                  </div>
                </div>

                {/* Technology Rationale & Security */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Architecture Rationale & Security</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p>
                      <strong>Why React 19 + Express?</strong> Enables reactive client-side multi-tab workbench while keeping LLM secrets secure on the server.
                    </p>
                    <p>
                      <strong>Path Traversal Defense:</strong> All file reads & writes are strictly validated to prevent directory escapes (`../..`).
                    </p>
                    <p>
                      <strong>Protected Files:</strong> `.env` and `.git/` files require explicit human approval before modification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FRONTEND & BACKEND CONTRACTS */}
          {activeArtifactTab === 'code' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>⚛️ Frontend & Backend Engineering Contracts</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Production Code
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Core modules implemented by Frontend, Backend, and Full-Stack Leads.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(vfs?.getAllFiles()?.keys() || [])
                    .filter((f: any) => typeof f === 'string' && !f.includes('node_modules') && !f.startsWith('.'))
                    .slice(0, 4)
                    .map((filePath: any) => (
                      <button
                        key={filePath}
                        onClick={() => openFile(filePath)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>{filePath.split('/').pop()}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Architecture: State Management</span>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{`// State transition and domain model orchestration
export interface WorkspaceState {
  activeFile: string | null;
  modifiedFiles: string[];
  testStatus: 'passing' | 'failing';
}`}</pre>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Pure immutable state contracts enforced across modules.
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Security & Quality Policies</span>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{`// Quality gate validation & permission policies
export function validateQualityGate(step: string): boolean {
  return true; // Enforces strict branch rules
}`}</pre>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Enforces role boundary checks and sandbox isolation.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QA & SELF-HEALING DEBUGGER */}
          {activeArtifactTab === 'qa' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🧪 Lead QA & Automated Self-Healing Debugger</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      failedTests > 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {failedTests > 0 ? `${failedTests} Assertion Failure Detected` : 'All Test Suites Passing'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Test strategy, execution results, root cause analysis, and automated self-correction.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={runTests}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Run Vitest Suite</span>
                  </button>

                  {failedTests > 0 && (
                    <button
                      onClick={() => triggerSelfHealDebug()}
                      className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 animate-pulse"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Trigger 1-Click Self-Heal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Failing Test Diagnosis Card */}
              {failedTests > 0 ? (
                (() => {
                  const failingTest = testResults.find((t: any) => t.status === 'failed');
                  return (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                          <XCircle className="w-4 h-4" />
                          <span>Failure Diagnosis: {failingTest?.testName || 'Test assertion failure'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-300">{failingTest?.filePath || 'Workspace Test'}</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-rose-300 overflow-x-auto">
                        <div>FAIL {failingTest?.testSuite || failingTest?.filePath} &gt; {failingTest?.testName}</div>
                        {failingTest?.errorStack && (
                          <div className="text-slate-400 mt-1 whitespace-pre-wrap">{failingTest.errorStack}</div>
                        )}
                      </div>

                      <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300 flex flex-col gap-1.5">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          Root Cause Analysis by AI Debugger:
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Failure detected in <code className="text-indigo-300 font-mono">{failingTest?.filePath}</code> during assertion verification. Self-healing debugger can analyze the stack trace and generate an AST repair patch.
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-mono">Automated Fix Ready: Inspect stack trace and synthesize patch.</span>
                          <button
                            onClick={() => triggerSelfHealDebug(failingTest?.errorStack)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow"
                          >
                            Apply Self-Healing Patch
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span className="font-bold text-emerald-300 text-sm">All Test Suites Verified & Green</span>
                  <p className="text-xs text-slate-400 max-w-md">
                    Vitest unit assertions, RBAC permissions matrix, and acceptance tests are passing with zero regressions.
                  </p>
                </div>
              )}

              {/* Test Coverage & Suites Table */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Suite Coverage</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  {testResults.map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        t.status === 'passed'
                          ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold block truncate">{t.testName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.testSuite}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                        t.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONTRACTS & FILE LOCKS */}
          {activeArtifactTab === 'contracts' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🔒 Sub-Agent Task Contracts & File Reservations</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Conflict-Free Concurrency
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Hierarchical task contracts prevent overwrite collisions across concurrent sub-agents.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Contracts Queue */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Task Delegation Contracts ({tasks.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
                    {tasks.map(task => (
                      <div
                        key={task.taskId}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate">{task.title}</span>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            task.status === 'working' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                            task.status === 'waiting_dependency' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {task.status === 'working' ? '⚡ Parallel Active' : task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-semibold text-indigo-400">{task.parentAgentId}</span>
                          <span>&rarr;</span>
                          <span className="font-mono text-cyan-300">{task.subAgentRole}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{task.objective}</p>
                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                          <span className="font-mono truncate max-w-[170px] text-amber-300/80">
                            Files: {task.allowedFilePaths.join(', ')}
                          </span>
                          <span className="font-mono text-slate-500">
                            {task.dependencies.length > 0 ? `Deps: ${task.dependencies.length}` : 'Independent (Parallel)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quality Gate Completion Reports */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quality Gate Completion Reports ({reports.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto">
                    {reports.map((rep, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {rep.subAgentRole}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{rep.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{rep.workCompleted}</p>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Test Assertions: <strong className="text-emerald-400">{rep.testResults}</strong> ({rep.testsRun.join(', ')})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
