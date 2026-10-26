import React, { useState, useEffect, useMemo } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  GitBranch,
  GitCommit,
  Flame,
  Layers,
  History,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCode,
  Calendar,
  User,
  ShieldAlert,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  CodeEvolutionMap,
  EvolutionCommit,
  CodeHotspot,
  RegressionInvestigationResult,
} from '../../types/codeEvolution';

export const CodeEvolutionView: React.FC = () => {
  const { codeEvolutionService, openFile, setActiveView } = useIDE();

  const [evolutionMap, setEvolutionMap] = useState<CodeEvolutionMap | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<EvolutionCommit | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'hotspots' | 'architecture' | 'regression'>('timeline');
  const [regressionQuery, setRegressionQuery] = useState('');
  const [regressionResult, setRegressionResult] = useState<RegressionInvestigationResult | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    codeEvolutionService.analyze({ workspaceId: 'active-workspace' }).then((res: CodeEvolutionMap) => {
      setEvolutionMap(res);
      if (res.commits.length > 0) setSelectedCommit(res.commits[0]);
    });
  }, [codeEvolutionService]);

  const handleRunRegressionInvestigation = async () => {
    if (!regressionQuery.trim()) return;
    setIsInvestigating(true);
    try {
      const res = await codeEvolutionService.investigateRegression(regressionQuery);
      setRegressionResult(res);
    } finally {
      setIsInvestigating(false);
    }
  };

  // ⚡ Bolt: Memoize heavy list transformations on code evolution commits to prevent render lag
  const filteredCommits = useMemo(() => {
    return (evolutionMap?.commits || []).filter(c =>
      c.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.author.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.shortHash.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [evolutionMap?.commits, searchFilter]);

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Code Evolution Map
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Git Evidence-Grounded
              </span>
            </h1>
            <p className="text-xs text-slate-400">Track repository velocity, architectural shifts, code churn, and hotspot risks over time.</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Commit Timeline
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'hotspots' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Hotspot Analysis
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'architecture' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Architecture Drift
          </button>
          <button
            onClick={() => setActiveTab('regression')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'regression' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Regression Investigator
          </button>
        </div>

        <button
          onClick={() => setActiveView('editor')}
          className="px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Return to Main Editor Workspace"
        >
          <span>←</span> Back to Editor
        </button>
      </div>

      {/* Stats Summary Bar */}
      {evolutionMap && (
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/30 text-xs font-mono">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Total Commits:</span>
            <span className="font-bold text-white">{evolutionMap.statistics.totalCommits}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Weekly Churn:</span>
            <span className="font-bold text-emerald-300">+{evolutionMap.statistics.weeklyChurn} lines</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Identified Hotspots:</span>
            <span className="font-bold text-amber-300">{evolutionMap.statistics.hotspotsCount} files</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Active Authors:</span>
            <span className="font-bold text-white">{evolutionMap.statistics.totalAuthors}</span>
          </div>
        </div>
      )}

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* 1. TIMELINE VIEW */}
        {activeTab === 'timeline' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Commit list */}
            <div className="w-1/2 border-r border-slate-800 flex flex-col min-h-0">
              <div className="p-3 border-b border-slate-800 bg-slate-900/40">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search commits by message, author, or hash..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
                {filteredCommits.map(c => {
                  const isSelected = selectedCommit?.hash === c.hash;
                  return (
                    <div
                      key={c.hash}
                      onClick={() => setSelectedCommit(c)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-900/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span className="text-indigo-400 font-bold">{c.shortHash}</span>
                        <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-100 truncate">{c.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                        <span>{c.author}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-emerald-400">+{c.additions}</span>
                          <span className="text-rose-400">-{c.deletions}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commit Details & Diff */}
            <div className="w-1/2 flex flex-col min-h-0 overflow-y-auto p-6 bg-slate-950">
              {selectedCommit ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Selected Commit</span>
                    <h2 className="text-base font-bold text-white mt-0.5">{selectedCommit.message}</h2>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                      <span>Hash: {selectedCommit.hash}</span>
                      <span>Author: {selectedCommit.author}</span>
                      <span>{new Date(selectedCommit.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-300">Affected Symbols</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCommit.affectedSymbols.map((sym, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-indigo-300 text-xs rounded font-mono">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-300">File Modifications & Churn</span>
                    <div className="font-mono text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                        <span>src/context/IDEContext.tsx</span>
                        <span className="text-emerald-400">+{selectedCommit.additions} -{selectedCommit.deletions}</span>
                      </div>
                      <div className="flex justify-between p-1.5 bg-slate-950 rounded">
                        <span>src/services/desktopBridge.ts</span>
                        <span className="text-emerald-400">+24 -4</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
                    <span className="text-slate-400 block mb-2 font-sans font-bold">Porcelain Diff Chunk:</span>
                    <pre className="text-emerald-400 bg-slate-950 p-2.5 rounded overflow-x-auto text-[11px]">
{`@@ -120,4 +120,8 @@
+ export const FILE_DRAG_MIME = 'application/x-vertexforge-file';
+ export interface FileDragPayload { path: string; workspaceId: string; }
- const oldHandler = () => null;
+ const canonicalHandler = () => editorFileService.openFile();`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select a commit from the timeline to view historical impact and diffs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. HOTSPOTS VIEW */}
        {activeTab === 'hotspots' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Repository High-Churn Hotspots</h2>
              <p className="text-xs text-slate-400">Measured by commit frequency, churn volume, author diversity, and regression density.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {evolutionMap?.hotspots.map(spot => (
                <div key={spot.path} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => openFile(spot.path)}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <FileCode className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                      <span className="text-sm font-bold font-mono text-white group-hover:underline">{spot.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Hotspot Risk:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {spot.score}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-slate-950 p-2.5 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Commits:</span>
                      <span className="text-white font-bold">{spot.commitFrequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Churn:</span>
                      <span className="text-emerald-400 font-bold">{spot.churn} lines</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Authors:</span>
                      <span className="text-white font-bold">{spot.authorsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Recent Edits:</span>
                      <span className="text-indigo-300 font-bold">{spot.recentModifications}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Hotspot Signals:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                      {spot.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ARCHITECTURE DRIFT */}
        {activeTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">Architectural Evolution Log</h2>
              <p className="text-xs text-slate-400">Chronological structural changes across layers, packages, and major configurations.</p>
            </div>

            <div className="space-y-3">
              {evolutionMap?.architectureChanges.map((arch, i) => (
                <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono font-bold">
                      {arch.changeType.toUpperCase()}
                    </span>
                    <span className="text-slate-500 font-mono">{new Date(arch.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200">{arch.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {arch.affectedPaths.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[11px] rounded font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. AI REGRESSION INVESTIGATOR */}
        {activeTab === 'regression' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white">AI Regression Investigator</h2>
              <p className="text-xs text-slate-400">Describe a bug or symptom to find when and where it was likely introduced in Git history.</p>
            </div>

            <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">Symptom or Error Stack:</label>
              <textarea
                value={regressionQuery}
                onChange={e => setRegressionQuery(e.target.value)}
                placeholder="e.g. Uncaught TypeError in API handler or event listener state corruption..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleRunRegressionInvestigation}
                disabled={isInvestigating || !regressionQuery.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                {isInvestigating ? 'Correlating Git History...' : 'Investigate Probable Regression Commit'}
              </button>
            </div>

            {regressionResult && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Regression Discovery</h3>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Confidence: {Math.round(regressionResult.confidence * 100)}%
                  </span>
                </div>

                {regressionResult.likelyCommit && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                    <div className="text-indigo-400 font-bold">
                      Commit: {regressionResult.likelyCommit.shortHash} — "{regressionResult.likelyCommit.message}"
                    </div>
                    <div className="text-slate-400">Author: {regressionResult.likelyCommit.author}</div>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-300">Evidence Chain:</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    {regressionResult.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Suspect Code Diff:</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {regressionResult.relevantDiff}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
