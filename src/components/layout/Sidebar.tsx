import { AutonomyMode } from '../../types/ide';
import { logger } from '../../services/logger';
import React, { useState, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { FILE_DRAG_MIME, FileDragPayload } from '../../types/dragDrop';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  GitBranch,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  Layers,
  FlaskConical,
  Play,
  Wrench,
  Shield,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PanelLeft,
  PanelRight,
  X,
  Copy,
  Edit2,
  GitCommit,
  Code2,
  Blocks,
  Download,
  Star,
} from 'lucide-react';
import { FileNode, AgentRole } from '../../types/ide';
import { DebugSidebar } from '../debug/DebugSidebar';
import { ExplorerSidebarTab } from '../sidebar/ExplorerSidebarTab';
import { ExtensionsSidebarTab } from '../sidebar/ExtensionsSidebarTab';
import { GitSidebar } from '../git/GitSidebar';
import { TestExplorerPanel } from '../testing/TestExplorerPanel';

export const Sidebar: React.FC = () => {
  const layout = useLayout();
  const {
    activeSidebarTab,
    fileTree,
    activeFile,
    activeFileContent,
    openFile,
    createFileOrFolder,
    deleteFileOrFolder,
    modifiedFiles,
    commitChanges,
    revertFile,
    testResults,
    runTests,
    triggerSelfHealDebug,
    activeProject,
    activeAgent,
    setActiveAgent,
    autonomyMode,
    setAutonomyMode,
    vfs,
    setIsOpenFolderModalOpen,
    setIsProjectWizardOpen,
    setIsCloneModalOpen,
    openLocalFolder,
  } = useIDE();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ path: string; line: number; text: string }>>([]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: Array<{ path: string; line: number; text: string }> = [];
    const searchNode = (node: FileNode) => {
      if (node.type === 'file' && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              path: node.path,
              line: idx + 1,
              text: line.trim(),
            });
          }
        });
      }
      if (node.children) {
        node.children.forEach(searchNode);
      }
    };

    (fileTree || []).forEach(searchNode);
    setSearchResults(results.slice(0, 50));
  };


  // Git state
  const [commitMessage, setCommitMessage] = useState('');

  // New file/folder input state

  // Outline, Timeline & File Context Menu States

  const agentsList: { role: AgentRole; title: string; desc: string; icon: string }[] = [
    { role: 'Architect', title: 'Principal Architect', desc: 'Requirements analysis, tech stack selection, data models, and API contracts.', icon: '🏗️' },
    { role: 'Developer', title: 'Senior Developer', desc: 'Full-stack implementation, multi-file code writing, and refactoring.', icon: '💻' },
    { role: 'Frontend', title: 'Frontend Specialist', desc: 'Responsive interfaces, accessibility, UI components, and state.', icon: '🎨' },
    { role: 'Backend', title: 'Backend Specialist', desc: 'REST/GraphQL endpoints, database schemas, authentication, and security.', icon: '⚙️' },
    { role: 'Mobile', title: 'Mobile Specialist', desc: 'Native Kotlin/Compose, Swift/SwiftUI, and React Native / Expo.', icon: '📱' },
    { role: 'Testing', title: 'Testing Specialist', desc: 'Unit, integration, and assertion tests with complete coverage.', icon: '🧪' },
    { role: 'Debugger', title: 'Self-Correction Debugger', desc: 'Root-cause analysis, error reproduction, and automated patch verification.', icon: '🩺' },
    { role: 'Reviewer', title: 'Security & Code Auditor', desc: 'AST inspection, secret leak prevention, and regression checks.', icon: '🛡️' },
    { role: 'DocGen', title: 'Technical Writer', desc: 'Architecture documentation, API references, and quickstart guides.', icon: '📚' },
  ];

  return (
    <div
      style={{
        width: `${layout.config.primarySidebarWidth}px`,
        backgroundColor: 'var(--ide-sidebar-bg)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="flex flex-col h-full self-stretch min-h-0 select-none shrink-0 border rounded-xl overflow-hidden shadow-sm"
    >
      {/* 1. EXPLORER TAB (Modularized) */}
      {activeSidebarTab === 'explorer' && <ExplorerSidebarTab />}

      {/* 2. SEARCH TAB */}
      {activeSidebarTab === 'search' && (
        <div className="flex flex-col h-full p-3 gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Search in Workspace</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search code or keywords..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {searchQuery ? `${searchResults.length} results found` : 'Type to search across all files'}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
            {searchResults.map((res, i) => (
              <div
                key={i}
                onClick={() => openFile({ workspaceId: activeProject?.id || 'workspace', path: res.path, source: 'search', line: res.line })}
                className="p-2 rounded bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-750 flex flex-col gap-0.5"
                title={`Open ${res.path} at line ${res.line}`}
              >
                <div className="flex justify-between items-center text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  <span className="truncate">{res.path}</span>
                  <span className="text-slate-400 dark:text-slate-500">:{res.line}</span>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono truncate">{res.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GIT SOURCE CONTROL */}
      {activeSidebarTab === 'git' && (
        <GitSidebar />
      )}

      {/* 4. TESTS TAB */}
      {activeSidebarTab === 'tests' && (
        <TestExplorerPanel />
      )}

      {/* 5. AGENTS INSPECTOR TAB */}
      {activeSidebarTab === 'agents' && (
        <div className="flex flex-col h-full p-3 gap-2 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Specialized Autonomous Agents
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select an agent to direct prompt inquiries or assign specialized lifecycle responsibilities.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            {agentsList.map(agent => (
              <div
                key={agent.role}
                onClick={() => setActiveAgent(agent.role)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  activeAgent === agent.role
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{agent.icon}</span>
                    <span className="text-xs font-bold text-white">{agent.title}</span>
                  </div>
                  {activeAgent === agent.role && (
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TECH STACK TAB */}
      {activeSidebarTab === 'stack' && (
        <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Intelligent Tech Stack Selection
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-semibold">Current Archetype</span>
            <span className="font-bold text-indigo-300 capitalize">{activeProject.techStack.archetype ? activeProject.techStack.archetype.replace('-', ' ') : 'Universal Workspace'}</span>

            <div className="border-t border-slate-700/60 pt-2 flex flex-col gap-1.5">
              <div>
                <span className="text-slate-400 text-[10px] block">Frontend</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.frontend}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Backend</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.backend || 'Node.js'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Database</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.database || 'None / In-Memory'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Test Suite</span>
                <span className="text-slate-200 font-mono text-[11px]">{activeProject.techStack.testRunner || 'Vitest'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-300">Architect Rationale</span>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
              {activeProject.memory?.purpose || 'Full-stack application development workspace with live code execution and terminal orchestration.'}
            </p>
          </div>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeSidebarTab === 'settings' && (
        <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings & Model Config</div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 text-xs">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Active AI Model</span>
            <span className="font-bold text-emerald-400 font-mono">gemini-3.8-flash</span>
            <p className="text-[10px] text-slate-400">
              Google AI Studio modern genai engine connected via server-side proxy route.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <label className="font-semibold text-slate-300">Autonomy Permission Level</label>
            <select
              value={autonomyMode}
              onChange={e => setAutonomyMode(e.target.value as AutonomyMode)}
              className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
            >
              <option value="assist">Assist (Always ask human confirmation)</option>
              <option value="supervised">Supervised (Automatic safe edits, confirm terminal)</option>
              <option value="autonomous">Autonomous (Full self-planning & self-repair)</option>
            </select>
          </div>
        </div>
      )}

      {/* 8. RUN & DEBUG TAB (DAP Multi-Language Debugger) */}
      {activeSidebarTab === 'debug' && <DebugSidebar />}

      {/* 9. EXTENSIONS & PLUGINS MARKETPLACE TAB (Modularized) */}
      {activeSidebarTab === 'extensions' && <ExtensionsSidebarTab />}
    </div>
  );
};
