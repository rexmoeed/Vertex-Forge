import React from 'react';
import { useIDE } from '../../context/IDEContext';
import { Users, Key, RotateCw, Zap, Play } from 'lucide-react';
import { AgentDeliverablesPanel } from './agent/AgentDeliverablesPanel';
import { SwarmMissionCockpit } from './SwarmMissionCockpit';
import { AgentDecompositionToolbar } from './agent/AgentDecompositionToolbar';
import { AgentAutonomousEngineCard } from './agent/AgentAutonomousEngineCard';
import { useAgentWorkspace } from '../../hooks/useAgentWorkspace';

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
  } = useIDE();

  const ws = useAgentWorkspace(vfs, activeProject);
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
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

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-5 border-r border-slate-800 pr-5 text-xs whitespace-nowrap shrink-0">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block whitespace-nowrap">Quality Gates</span>
              <span className="text-emerald-400 font-bold font-mono text-sm whitespace-nowrap">{ws.totalQualityGates} Passed</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block whitespace-nowrap">Delegated Tasks</span>
              <span className="text-indigo-400 font-bold font-mono text-sm whitespace-nowrap">{ws.tasks.length} Managed</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block whitespace-nowrap">File Locks</span>
              <span className="text-cyan-400 font-bold font-mono text-sm whitespace-nowrap">{ws.hierarchyService.getFileReservations().length} Active</span>
            </div>
          </div>

          <button
            onClick={() => setActiveView('editor')}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Return to Main Editor Workspace"
          >
            <span>←</span> Editor
          </button>

          <button
            onClick={() => setActiveView('providers')}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-750 hover:border-amber-500/50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Configure LLM model assignments and BYOK API keys for each agent role"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">Agent Models & Keys</span>
          </button>

          <button
            onClick={ws.handleRunParallelSubAgents}
            disabled={ws.isParallelRunning}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            title="Decompose any active project and execute multiple sub-agents in parallel"
          >
            {ws.isParallelRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />}
            <span className="whitespace-nowrap">{ws.isParallelRunning ? `Running (${ws.activeParallelSubAgents.length} Parallel)...` : 'Decompose & Run Parallel'}</span>
          </button>

          <button
            onClick={ws.handleRunFullTeamBenchmark}
            disabled={ws.isOrchestrating || ws.isParallelRunning}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
          >
            {ws.isOrchestrating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span className="whitespace-nowrap">Benchmark</span>
          </button>
        </div>
      </div>

      {/* 1A. DYNAMIC PROJECT DECOMPOSITION & MULTI-AGENT PARALLEL EXECUTION STUDIO */}
      <AgentDecompositionToolbar
        projectGoalInput={ws.projectGoalInput}
        setProjectGoalInput={ws.setProjectGoalInput}
        parallelConcurrency={ws.parallelConcurrency}
        setParallelConcurrency={ws.setParallelConcurrency}
        isParallelRunning={ws.isParallelRunning}
        activeParallelSubAgents={ws.activeParallelSubAgents}
        tasks={ws.tasks}
        activeProjectName={activeProject?.name}
        onRunParallel={ws.handleRunParallelSubAgents}
        onDecomposeProject={ws.handleDecomposeProject}
        onCancelParallel={ws.handleCancelParallel}
        onResetTasks={ws.handleResetTasks}
      />

      {/* 1B. AUTONOMOUS AI SOFTWARE ENGINEER STUDIO */}
      <AgentAutonomousEngineCard
        autonomousExecutionState={autonomousExecutionState}
        autonomyMode={autonomyMode}
        setAutonomyMode={setAutonomyMode}
        autonomousInput={ws.autonomousInput}
        setAutonomousInput={ws.setAutonomousInput}
        isLaunching={ws.isLaunching}
        onLaunch={async input => {
          ws.setIsLaunching(true);
          try {
            await startAutonomousPlan(input);
          } finally {
            ws.setIsLaunching(false);
          }
        }}
        autonomousPlan={autonomousPlan}
        onPausePlan={pauseAutonomousPlan}
        onResumePlan={resumeAutonomousPlan}
        onCancelPlan={cancelAutonomousPlan}
        onRollbackPlan={() => rollbackAutonomousPlan()}
        onApprovePlan={approveAutonomousPlan}
        onRejectPlan={rejectAutonomousPlan}
        onRetryTask={retryAutonomousTask}
      />

      {/* SWARM MISSION COCKPIT & LIVE GRAPH */}
      <SwarmMissionCockpit hierarchyService={ws.hierarchyService} onNavigateToFile={openFile} />

      {/* 2. TEAM LEADS ROSTER (Level 2) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Specialist Team Leads (Level 2 Hierarchy)
          </span>
          <span className="text-[11px] text-slate-500">Select any role to inspect deliverables, sub-agents & contracts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {ws.leads.map(lead => {
            const isSelected = ws.selectedLead?.role === lead.role;
            return (
              <div
                key={lead.role}
                onClick={() => {
                  ws.setSelectedLead(lead);
                  if (lead.role === 'ProductDesignLead') ws.setActiveArtifactTab('brief');
                  else if (lead.role === 'UIDesignLead') ws.setActiveArtifactTab('design');
                  else if (lead.role === 'ArchitectureLead') ws.setActiveArtifactTab('architecture');
                  else if (lead.role === 'QALead') ws.setActiveArtifactTab('qa');
                  else if (lead.role === 'FrontendLead' || lead.role === 'BackendLead' || lead.role === 'FullStackLead') ws.setActiveArtifactTab('code');
                  else ws.setActiveArtifactTab('contracts');
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 min-w-0 overflow-hidden break-words ${
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

      {/* 3. SPECIALIST DELIVERABLES & INTERACTIVE PANELS (Modularized) */}
      <AgentDeliverablesPanel
        activeArtifactTab={ws.activeArtifactTab}
        setActiveArtifactTab={ws.setActiveArtifactTab}
        activeProject={activeProject}
        tasks={ws.tasks}
        reports={ws.reports}
        testResults={testResults}
        failedTests={failedTests}
        runTests={runTests}
        triggerSelfHealDebug={triggerSelfHealDebug}
        vfs={vfs}
        openFile={openFile}
        setActiveView={setActiveView}
      />
    </div>
  );
};
