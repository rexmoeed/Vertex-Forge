import React, { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Activity,
  Cpu,
  Lock,
  Play,
  RotateCw,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
  Eye,
  RefreshCw,
  Server,
  Sparkles,
} from 'lucide-react';
import { AgentHierarchyService } from '../../services/agentHierarchyService';
import { SwarmExecutionPlan, GuardianStatus, FileReservation, SubAgentTaskContract } from '../../types/agentHierarchy';

interface SwarmMissionCockpitProps {
  hierarchyService: AgentHierarchyService;
  onNavigateToFile?: (path: string) => void;
}

export const SwarmMissionCockpit: React.FC<SwarmMissionCockpitProps> = ({
  hierarchyService,
  onNavigateToFile,
}) => {
  const [activeTab, setActiveTab] = useState<'network_graph' | 'launchpad' | 'file_locks' | 'guardians'>('network_graph');
  const [featureInput, setFeatureInput] = useState('User Authentication & RBAC');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastPlan, setLastPlan] = useState<SwarmExecutionPlan | null>(null);

  // Telemetry state
  const [guardianStatus, setGuardianStatus] = useState<GuardianStatus>(() => hierarchyService.getGuardianStatus());
  const [activeReservations, setActiveReservations] = useState<FileReservation[]>(() => hierarchyService.getFileReservations());
  const [tasks, setTasks] = useState<SubAgentTaskContract[]>(() => hierarchyService.getTasks());
  const [swarms, setSwarms] = useState<SwarmExecutionPlan[]>(() => hierarchyService.getActiveSwarms());

  useEffect(() => {
    hierarchyService.setUpdateListener(() => {
      setGuardianStatus(hierarchyService.getGuardianStatus());
      setActiveReservations(hierarchyService.getFileReservations());
      setTasks(hierarchyService.getTasks());
      setSwarms(hierarchyService.getActiveSwarms());
    });
  }, [hierarchyService]);

  const handleLaunchFeatureSwarm = async () => {
    if (!featureInput.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const plan = hierarchyService.decomposeFeatureSlicingSwarm(featureInput);
      setLastPlan(plan);
      await hierarchyService.executeSwarmPlan(plan.swarmId, { concurrency: 4, stepDelayMs: 20 });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleToggleGuardians = () => {
    if (guardianStatus.isActive) {
      hierarchyService.stopBackgroundGuardians();
    } else {
      hierarchyService.startBackgroundGuardians(5000);
    }
    setGuardianStatus(hierarchyService.getGuardianStatus());
  };

  const handleLaunchHealingSwarm = async () => {
    setIsExecuting(true);
    try {
      const plan = hierarchyService.spawnSelfHealingSwarm(
        'AssertionError: Expected 200 OK but received 500 InternalServerError at AuthHandler.ts:42',
        'src/services/authHandler.ts',
        'src/services/__tests__/authHandler.spec.ts'
      );
      setLastPlan(plan);
      await hierarchyService.executeSwarmPlan(plan.swarmId, { concurrency: 2, stepDelayMs: 20 });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLaunchDocSyncSwarm = async () => {
    setIsExecuting(true);
    try {
      const plan = hierarchyService.spawnDocEnvSyncSwarm(['src/services/authHandler.ts', 'src/models/user.ts']);
      setLastPlan(plan);
      await hierarchyService.executeSwarmPlan(plan.swarmId, { concurrency: 2, stepDelayMs: 20 });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl text-slate-100 font-sans">
      {/* 1. Cockpit Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">Visual Swarm Cockpit & Live Graph</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Parallel Multi-Agent Grid
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-collision concurrency engine orchestrating decoupled specialists with live RWLocks
            </p>
          </div>
        </div>

        {/* Global Action Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Active Swarms:</span>
            <span className="font-bold text-white">{swarms.length}</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Held RWLocks:</span>
            <span className="font-bold text-white">{activeReservations.length}</span>
          </div>

          <button
            onClick={handleToggleGuardians}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              guardianStatus.isActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            {guardianStatus.isActive ? 'Guardians Active' : 'Start Guardians'}
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 overflow-x-auto scrollbar-none flex-nowrap md:flex-wrap min-w-0 max-w-full">
        <button
          onClick={() => setActiveTab('network_graph')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'network_graph'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Node Topology
        </button>

        <button
          onClick={() => setActiveTab('launchpad')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'launchpad'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          One-Click Launchpad
        </button>

        <button
          onClick={() => setActiveTab('file_locks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'file_locks'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          RWLock Reservations ({activeReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('guardians')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'guardians'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Guardian Sentry Status
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'network_graph' && (
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[360px] overflow-hidden">
          {/* Background grid dots */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Topology Visual Representation */}
          <div className="w-full max-w-3xl flex flex-col items-center gap-8 relative z-10">
            {/* Center Master Node */}
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 border border-white/20 flex items-center gap-2.5">
              <Server className="w-4 h-4 animate-spin" />
              <span>Swarm Orchestration Core</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Coordinator
              </span>
            </div>

            {/* Connecting Lines */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {/* Swarm Specialist Nodes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { name: 'Feature Slicer', role: 'API + DB + UI', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', icon: '⚡' },
                { name: 'TypeLint Sentry', role: 'Continuous AST', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', icon: '🛡️' },
                { name: 'Self-Healing Patch', role: 'Diagnosis ➔ Diff', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', icon: '🩹' },
                { name: 'Doc & Env Sync', role: 'TSDoc + .env.example', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', icon: '🔄' },
              ].map((node, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${node.color} flex flex-col gap-1.5 shadow-lg backdrop-blur-md transition-all hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{node.icon}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="text-xs font-bold text-white mt-1">{node.name}</span>
                  <span className="text-[10px] text-slate-400">{node.role}</span>
                </div>
              ))}
            </div>

            {/* Active Task Progress bar */}
            {isExecuting && (
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-4">
                <div className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 h-full animate-pulse w-3/4 transition-all duration-300" />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'launchpad' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Swarm 1: Feature-Slicing */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <h3 className="text-sm font-bold text-white">Feature-Slicing Swarm (/swarm-feature)</h3>
                <p className="text-xs text-slate-400">Concurrent Backend API, DB Schema, Reactive UI & Tests</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                placeholder="Enter feature name..."
                className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                disabled={isExecuting}
                onClick={handleLaunchFeatureSwarm}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Dispatch
              </button>
            </div>
          </div>

          {/* Swarm 2: Self-Healing */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🩹</span>
              <div>
                <h3 className="text-sm font-bold text-white">Self-Healing Swarm (/swarm-heal)</h3>
                <p className="text-xs text-slate-400">Devin-style failure diagnosis & AST surgical patch synthesis</p>
              </div>
            </div>
            <button
              disabled={isExecuting}
              onClick={handleLaunchHealingSwarm}
              className="mt-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simulate & Heal Test Failure
            </button>
          </div>

          {/* Swarm 3: Doc & Environment Sync */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <div>
                <h3 className="text-sm font-bold text-white">Documentation & Env Sync (/swarm-sync)</h3>
                <p className="text-xs text-slate-400">Keep README, TSDoc, and .env.example strictly synchronized</p>
              </div>
            </div>
            <button
              disabled={isExecuting}
              onClick={handleLaunchDocSyncSwarm}
              className="mt-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Sync Docs & Variables
            </button>
          </div>

          {/* Swarm 4: Background Guardians */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <div>
                <h3 className="text-sm font-bold text-white">Background Guardians (/swarm-guard)</h3>
                <p className="text-xs text-slate-400">TypeLint, SecretLeakSniffer, and PerfLeakWatcher sentries</p>
              </div>
            </div>
            <button
              onClick={handleToggleGuardians}
              className={`mt-auto px-4 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                guardianStatus.isActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {guardianStatus.isActive ? 'Pause Surveillance' : 'Activate All Sentries'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'file_locks' && (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white">Active RWLock Reservations (DAG Segregation)</span>
            <span className="text-[11px] text-slate-400">Guarantees 0 write conflicts across parallel sub-agents</span>
          </div>

          {activeReservations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No active file locks held. System is idle and ready for parallel dispatch.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {activeReservations.map((res, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <Lock className={`w-3.5 h-3.5 ${res.mode === 'exclusive_write' ? 'text-amber-400' : 'text-cyan-400'}`} />
                    <button
                      onClick={() => onNavigateToFile?.(res.filePath)}
                      className="text-slate-200 hover:text-indigo-400 font-mono transition-colors truncate max-w-[180px] sm:max-w-xs md:max-w-md min-w-0"
                      title={res.filePath}
                    >
                      {res.filePath}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{res.parentLead}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        res.mode === 'exclusive_write'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {res.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'guardians' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">TypeLint Sentry</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                AST Clean
              </span>
            </div>
            <p className="text-xs text-slate-400">Module boundary and strict type check surveillance.</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Errors Detected:</span>
              <span className="text-white font-mono font-bold">{guardianStatus.typeSentry.errorCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Secret Leak Sniffer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                {guardianStatus.secretSniffer.clean ? 'Protected' : 'Alert'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Scans code diffs and commits for exposed API keys and credentials.</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Leaks Intercepted:</span>
              <span className="text-white font-mono font-bold">{guardianStatus.secretSniffer.detectedCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Perf Leak Watcher</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Nominal
              </span>
            </div>
            <p className="text-xs text-slate-400">Surveillance over unclosed event listeners and runaway timeouts.</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Anomalies Logged:</span>
              <span className="text-white font-mono font-bold">{guardianStatus.perfWatcher.leaksFound}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwarmMissionCockpit;
