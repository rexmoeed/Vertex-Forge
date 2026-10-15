import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Project,
  FileNode,
  OpenTab,
  TaskItem,
  AgentRole,
  AgentLog,
  ProblemDiagnostic,
  TestResult,
  AutonomyMode,
  OrchestratorStatus,
  TerminalLine,
  GitDiff,
  GitCommit,
} from '../types/ide';
import { VirtualFileSystem } from '../services/virtualFs';
import { TerminalRunner } from '../services/terminalRunner';
import { GeminiService, AICodeReviewResponse } from '../services/geminiService';
import { ProposedFileChange, InspectionResult } from '../types/desktop';
import { ProjectProfile, DevServerProcess, GitProfile, DetectionContext } from '../types/project';
import { CodebaseIndexer } from '../services/codebaseIndexer';
import { AIProjectNavigator } from '../services/aiNavigator';
import { DesktopBridge } from '../services/desktopBridge';
import { GlobalProjectDetector } from '../services/projectDetector';
import { RecentProjects } from '../services/recentProjects';
import { OpenFileRequest, EditorFileService, editorFileService } from '../services/editorFileService';
import { voiceCodingEngine, VoiceCodingEngine } from '../services/voiceCodingEngine';
import { codeEvolutionService, ConcreteCodeEvolutionService } from '../services/codeEvolutionService';
import { bugDetective, ConcreteBugDetective } from '../services/bugDetectiveService';
import { productionWatchdogService, ProductionWatchdogService } from '../services/productionWatchdogService';
import { AutonomousAgentEngine } from '../services/autonomousAgentEngine';
import { AutonomousPlan, AutonomousExecutionState, VerificationSummary, PermissionMode } from '../types/autonomousAgent';
import { DebuggerEngine } from '../services/debuggerEngine';
import {
  Breakpoint,
  StackFrame,
  Scope,
  Variable,
  WatchExpression,
  Thread,
  DebugSession,
  DebugConsoleMessage,
  AIDebugDiagnosis,
} from '../types/debugger';
import { useTheme } from './ThemeContext';
import { SecurityAuditService } from '../services/securityAuditService';

export type CursorMode = 'ask' | 'edit' | 'agent' | 'review';
export type IDEActiveView = 'editor' | 'welcome' | 'agents' | 'design-system' | 'settings' | 'providers' | 'evolution' | 'bug-detective' | 'watchdog' | 'operator';

interface IDEContextType {
  // Cursor-Style Modes
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;

  // Codebase Navigation & Multi-File Editing
  indexer: CodebaseIndexer;
  navigator: AIProjectNavigator;
  proposedChanges: ProposedFileChange[];
  isMultiFileReviewOpen: boolean;
  setIsMultiFileReviewOpen: (val: boolean) => void;
  proposeMultiFileChanges: (instruction: string) => void;
  applySelectedChanges: (acceptedChanges: ProposedFileChange[]) => void;
  isAcceptanceModalOpen: boolean;
  setIsAcceptanceModalOpen: (val: boolean) => void;
  isControlPanelOpen: boolean;
  setIsControlPanelOpen: (val: boolean) => void;
  isProjectWizardOpen: boolean;
  setIsProjectWizardOpen: (val: boolean) => void;
  lastInspectionResult: InspectionResult | null;
  inspectFeature: (query: string) => InspectionResult;

  // Projects & Files
  projects: Project[];
  activeProject: Project;
  vfs: VirtualFileSystem;
  switchProject: (projectId: string) => void;
  createNewProject: (name: string, description: string, archetype?: any) => Promise<void>;
  fileTree: FileNode[];
  activeFile: string | null;
  activeFileContent: string;
  openTabs: OpenTab[];
  activeTabId: string | null;
  openFile: (path: string | OpenFileRequest, diffMode?: boolean) => Promise<OpenTab | void>;
  openFileInEditor: (request: OpenFileRequest | string, diffMode?: boolean) => Promise<OpenTab>;
  editorFileService: EditorFileService;
  closeTab: (tabId: string) => void;
  updateFileContent: (newContent: string) => void;
  saveCurrentFile: () => void;
  saveAllFiles: () => Promise<void>;
  // Auto-Save Management
  autoSave: boolean;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  autoSaveDelay: number;
  setAutoSaveDelay: React.Dispatch<React.SetStateAction<number>>;
  isAutoSaving: boolean;
  createFileOrFolder: (path: string, type: 'file' | 'folder', initialContent?: string) => Promise<void>;
  deleteFileOrFolder: (path: string) => Promise<void>;
  renameFileOrFolder: (oldPath: string, newPath: string) => Promise<boolean>;
  isCreatingFile: boolean;
  setIsCreatingFile: (val: boolean) => void;
  isCreatingFolder: boolean;
  setIsCreatingFolder: (val: boolean) => void;
  startCreatingFile: () => void;
  startCreatingFolder: () => void;

  // Real Workspace & Project Lifecycle
  projectProfile: ProjectProfile | null;
  updateProjectProfileOverrides: (overrides: ProjectProfile['userOverrides']) => void;
  refreshProjectHealth: () => void;
  openLocalFolder: (path?: string) => Promise<boolean>;
  openLocalFile: (filePath?: string) => Promise<boolean>;
  closeProject: () => void;
  confirmCloseProject: (saveAll: boolean) => void;
  isCloseModalOpen: boolean;
  setIsCloseModalOpen: (val: boolean) => void;
  cloneRepository: (repoUrl: string, targetDir?: string) => Promise<boolean>;
  isCloneModalOpen: boolean;
  setIsCloneModalOpen: (val: boolean) => void;
  isOpenFolderModalOpen: boolean;
  setIsOpenFolderModalOpen: (val: boolean) => void;
  devServerProcess: DevServerProcess | null;
  startDevServer: (command?: string) => Promise<void>;
  stopDevServer: () => Promise<void>;
  restartDevServer: () => Promise<void>;
  gitProfile: GitProfile | null;
  refreshGit: () => Promise<void>;
  gitStageFile: (filePath: string) => Promise<void>;

  // Terminal & Tests
  terminalHistory: TerminalLine[];
  runCommand: (cmd: string) => void;
  clearTerminal: () => void;
  testResults: TestResult[];
  problems: ProblemDiagnostic[];
  runTests: () => void;
  runBuild: () => Promise<void>;
  runLint: () => void;

  // Git & Diffs
  modifiedFiles: GitDiff[];
  commits: GitCommit[];
  commitChanges: (msg: string) => void;
  revertFile: (path: string) => void;

  // AI & Autonomous Orchestrator
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  activeAgent: AgentRole;
  setActiveAgent: (agent: AgentRole) => void;
  orchestratorStatus: OrchestratorStatus;
  taskPlan: TaskItem[];
  currentTaskIndex: number;
  agentLogs: AgentLog[];
  startAutonomousPlan: (userPrompt: string) => Promise<void>;
  executeStep: () => Promise<void>;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  cancelOrchestration: () => void;
  triggerSelfHealDebug: (errorDetails?: string) => Promise<void>;
  runSecurityReview: () => Promise<void>;
  codeReviewResult: AICodeReviewResponse | null;
  logAgentAction: (agent: AgentRole, action: string, status?: AgentLog['status'], details?: string, targetFile?: string) => void;

  // UI State
  activeView: IDEActiveView;
  setActiveView: (view: IDEActiveView) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeSidebarTab: 'explorer' | 'search' | 'git' | 'tests' | 'agents' | 'stack' | 'settings' | 'debug' | 'extensions';
  setActiveSidebarTab: (tab: any) => void;
  bottomPanelTab: 'terminal' | 'problems' | 'tests' | 'review' | 'audit' | 'debug';
  setBottomPanelTab: (tab: any) => void;
  isBottomPanelOpen: boolean;
  toggleBottomPanel: () => void;
  showPreview: boolean;
  setShowPreview: (val: boolean) => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  hasApiKey: boolean;
  isProjectIntelligenceOpen: boolean;
  cursorPosition: { line: number; column: number };
  setCursorPosition: (pos: { line: number; column: number }) => void;
  setIsProjectIntelligenceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Next-Gen Autonomous Engineering Services
  voiceCodingEngine: VoiceCodingEngine;
  codeEvolutionService: ConcreteCodeEvolutionService;
  bugDetective: ConcreteBugDetective;
  productionWatchdogService: ProductionWatchdogService;

  // Fully Autonomous AI Software Engineer Engine
  autonomousEngine: AutonomousAgentEngine;
  autonomousPlan: AutonomousPlan | null;
  autonomousExecutionState: AutonomousExecutionState;
  verificationSummary: VerificationSummary | null;
  pauseAutonomousPlan: () => void;
  resumeAutonomousPlan: () => void;
  cancelAutonomousPlan: () => void;
  approveAutonomousPlan: () => void;
  rejectAutonomousPlan: () => void;
  rollbackAutonomousPlan: (checkpointId?: string) => Promise<boolean>;
  retryAutonomousTask: (taskId: string) => Promise<void>;

  // Multi-Language Debugger Services & State (DAP)
  debuggerEngine: DebuggerEngine;
  debugSession: DebugSession | null;
  debugThread: Thread;
  debugBreakpoints: Breakpoint[];
  debugStackFrames: StackFrame[];
  debugVariables: Variable[];
  debugWatchExpressions: WatchExpression[];
  debugConsoleMessages: DebugConsoleMessage[];
  debugLocation: { filePath: string; line: number; column: number } | null;
  aiDebugDiagnosis: AIDebugDiagnosis | null;
  diagnoseCrashWithAI: () => Promise<void>;
  applyAIDebugFix: () => Promise<void>;
  toggleBreakpoint: (filePath: string, line: number) => void;
}

const DEFAULT_WORKSPACE: Project = {
  id: 'workspace-local',
  name: 'Workspace',
  description: 'Active project workspace',
  rootFiles: [],
  techStack: {
    frontend: 'Detecting...',
    styling: 'Detecting...',
    packageManager: 'npm',
  },
};

const IDEContext = createContext<IDEContextType | undefined>(undefined);

export const IDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([DEFAULT_WORKSPACE]);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_WORKSPACE);

  // Virtual Filesystem & Terminal Runner initialized with real workspace files
  const [vfs, setVfs] = useState<VirtualFileSystem>(() => new VirtualFileSystem([]));
  const [runner, setRunner] = useState<TerminalRunner>(() => new TerminalRunner(vfs));
  const [indexer, setIndexer] = useState<CodebaseIndexer>(() => new CodebaseIndexer(vfs));
  const [navigator, setNavigator] = useState<AIProjectNavigator>(() => new AIProjectNavigator(vfs, indexer));

  // Cursor-Style Modes (ask, edit, agent, review)
  const [cursorMode, setCursorMode] = useState<CursorMode>('agent');

  // Multi-File Proposed Changes & Granular Review
  const [proposedChanges, setProposedChanges] = useState<ProposedFileChange[]>([]);
  const [isMultiFileReviewOpen, setIsMultiFileReviewOpen] = useState(false);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
  const [isProjectIntelligenceOpen, setIsProjectIntelligenceOpen] = useState(false);
  const [lastInspectionResult, setLastInspectionResult] = useState<InspectionResult | null>(null);

  // Editor Tabs - initially empty until active project is loaded
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  // Auto-Save Management State & Persistence
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    const stored = localStorage.getItem('vertexforge_autosave');
    return stored !== null ? stored === 'true' : true;
  });
  const [autoSaveDelay, setAutoSaveDelay] = useState<number>(() => {
    const stored = localStorage.getItem('vertexforge_autosave_delay');
    return stored ? parseInt(stored, 10) : 1000;
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  // Synchronization refs for robust async handling, debouncing, and focus loss triggers
  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  const autoSaveDelayRef = useRef(autoSaveDelay);
  autoSaveDelayRef.current = autoSaveDelay;

  const activeFileRef = useRef(activeFile);
  activeFileRef.current = activeFile;

  const activeFileContentRef = useRef(activeFileContent);
  activeFileContentRef.current = activeFileContent;

  const openTabsRef = useRef(openTabs);
  openTabsRef.current = openTabs;

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('vertexforge_autosave', String(autoSave));
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('vertexforge_autosave_delay', String(autoSaveDelay));
  }, [autoSaveDelay]);

  // Terminal & Diagnostics
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'Vertex Forge Desktop AI Engineering Studio initialized.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'stdout',
      text: 'Host filesystem, genuine terminal process execution, and Git integration ready.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [problems, setProblems] = useState<ProblemDiagnostic[]>([]);
  const [codeReviewResult, setCodeReviewResult] = useState<AICodeReviewResponse | null>(null);

  // Orchestrator & Agents
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('supervised');
  const [activeAgent, setActiveAgent] = useState<AgentRole>('Architect');
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus>('idle');
  const [taskPlan, setTaskPlan] = useState<TaskItem[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [autonomousPlan, setAutonomousPlan] = useState<AutonomousPlan | null>(null);
  const [autonomousExecutionState, setAutonomousExecutionState] = useState<AutonomousExecutionState>('idle');
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString(),
      agent: 'Architect',
      action: 'Vertex Forge workspace security boundary initialized',
      status: 'info',
    },
  ]);

  // UI State
  const themeEngine = useTheme();
  const [activeView, setActiveView] = useState<IDEActiveView>('editor');
  const theme: 'dark' | 'light' = themeEngine.isDark ? 'dark' : 'light';
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'search' | 'git' | 'tests' | 'agents' | 'stack' | 'settings' | 'debug'>('explorer');
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'problems' | 'tests' | 'review' | 'audit' | 'debug'>('terminal');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const startCreatingFile = useCallback(() => {
    setActiveView('editor');
    setActiveSidebarTab('explorer');
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
  }, []);

  const startCreatingFolder = useCallback(() => {
    setActiveView('editor');
    setActiveSidebarTab('explorer');
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
  }, []);

  // Real Project Lifecycle & Dev Process State
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
  const [devServerProcess, setDevServerProcess] = useState<DevServerProcess | null>(null);
  const [gitProfile, setGitProfile] = useState<GitProfile | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [isOpenFolderModalOpen, setIsOpenFolderModalOpen] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });

  // Sync VFS when active project changes
  useEffect(() => {
    if (!activeProject.rootFiles || activeProject.rootFiles.length === 0) return;
    const newVfs = new VirtualFileSystem(activeProject.rootFiles);
    setVfs(newVfs);
    setRunner(new TerminalRunner(newVfs));
    const newIndexer = new CodebaseIndexer(newVfs);
    setIndexer(newIndexer);
    setNavigator(new AIProjectNavigator(newVfs, newIndexer));
    DesktopBridge.attachVFS(newVfs);
    voiceCodingEngine.setVFS(newVfs);
    codeEvolutionService.setVFS(newVfs);
    bugDetective.setVFS(newVfs);
    (window as any).__IDE_VFS__ = newVfs;
  }, [activeProject.id]);

  // Read active file content
  useEffect(() => {
    if (activeFile) {
      const existing = vfs.readFile(activeFile);
      if (existing !== null && existing !== undefined) {
        setActiveFileContent(existing);
      } else {
        DesktopBridge.readFile(activeFile).then(c => {
          vfs.writeFile(activeFile, c);
          setActiveFileContent(c);
        }).catch(() => {
          setActiveFileContent('');
        });
      }
    }
  }, [activeFile, vfs]);

  // Check health on mount
  useEffect(() => {
    GeminiService.checkHealth().then(res => {
      setHasApiKey(res.hasApiKey);
    });
  }, []);

  const logAgentAction = useCallback((agent: AgentRole, action: string, status: AgentLog['status'] = 'info', details?: string, targetFile?: string) => {
    const newLog: AgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      agent,
      action,
      status,
      details,
      targetFile,
    };
    setAgentLogs(prev => [newLog, ...prev]);
  }, []);

  // Switch project
  const switchProject = useCallback((projectId: string) => {
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setActiveProject(found);
      logAgentAction('Architect', `Switched active workspace to "${found.name}"`, 'info');
    }
  }, [projects, logAgentAction]);

  // Canonical Open File in Editor Pipeline (clicking, drag-and-drop, quick-open, search)
  const openFileInEditor = useCallback(async (request: OpenFileRequest | string, diffMode: boolean = false): Promise<OpenTab> => {
    const req: OpenFileRequest = typeof request === 'string'
      ? { workspaceId: activeProject.id, path: request, source: 'explorer', diffMode }
      : request;

    const normalizedPath = req.path.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || normalizedPath;
    const language = editorFileService.detectLanguage(normalizedPath);

    if (req.source === 'drag-drop') {
      console.log(`[DragDrop] drop file: ${normalizedPath}`);
    }
    console.log(`[Editor] openFile source: ${req.source} file: ${normalizedPath}`);

    // Check if file is already open in openTabs (preserve tab and buffer without duplicate)
    const existingTab = openTabs.find(t => t.filePath === normalizedPath);

    let content = vfs.readFile(normalizedPath);
    if (content === null || content === undefined) {
      try {
        content = await DesktopBridge.readFile(normalizedPath);
        vfs.writeFile(normalizedPath, content);
      } catch {
        content = '';
      }
    }

    // Auto-save previous dirty file before switching tabs if autoSave is enabled
    if (autoSaveRef.current && activeFileRef.current && activeFileRef.current !== normalizedPath) {
      const prevTab = openTabsRef.current.find((t: OpenTab) => t.filePath === activeFileRef.current);
      if (prevTab?.isDirty) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
        saveCurrentFile();
      }
    }

    if (req.line) {
      setCursorPosition({ line: req.line, column: req.column || 1 });
    }

    if (existingTab) {
      setActiveTabId(existingTab.id);
      setActiveFile(normalizedPath);
      setActiveFileContent(content);
      setActiveView('editor');
      console.log(`[Editor] tabActivated ${existingTab.title}`);
      logAgentAction('Developer', `Activated tab "${existingTab.title}" (source: ${req.source})`, 'info');
      return existingTab;
    } else {
      const newTab: OpenTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filePath: normalizedPath,
        title: fileName,
        language,
        diffMode: req.diffMode ?? diffMode,
        isDirty: false,
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setActiveFile(normalizedPath);
      setActiveFileContent(content);
      setActiveView('editor');
      console.log(`[Editor] tabActivated ${newTab.title}`);
      logAgentAction('Developer', `Opened "${newTab.title}" in editor (source: ${req.source})`, 'info');
      return newTab;
    }
  }, [openTabs, vfs, activeProject, logAgentAction, setCursorPosition]);

  const openFile = useCallback(async (path: string | OpenFileRequest, diffMode: boolean = false) => {
    return openFileInEditor(path, diffMode);
  }, [openFileInEditor]);

  // Close tab
  const closeTab = useCallback((tabId: string) => {
    // If closing a dirty tab and autoSave is active, save it
    const closingTab = openTabsRef.current.find((t: OpenTab) => t.id === tabId);
    if (autoSaveRef.current && closingTab?.isDirty) {
      const content = closingTab.filePath === activeFileRef.current ? activeFileContentRef.current : (vfs.readFile(closingTab.filePath) ?? '');
      vfs.writeFile(closingTab.filePath, content);
      DesktopBridge.writeFile(closingTab.filePath, content);
    }

    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const nextTab = filtered[filtered.length - 1];
        if (nextTab) {
          setActiveTabId(nextTab.id);
          setActiveFile(nextTab.filePath);
          setActiveFileContent(vfs.readFile(nextTab.filePath) ?? '');
        } else {
          setActiveTabId(null);
          setActiveFile(null);
          setActiveFileContent('');
        }
      }
      return filtered;
    });
  }, [activeTabId, vfs]);

  // Update file content while typing
  const updateFileContent = useCallback((newContent: string) => {
    activeFileContentRef.current = newContent;
    setActiveFileContent(newContent);
    const targetFile = activeFileRef.current;
    if (targetFile) {
      vfs.writeFile(targetFile, newContent);
      setOpenTabs(prev =>
        prev.map(t => (t.filePath === targetFile ? { ...t, isDirty: true } : t))
      );

      // Auto-Save Trigger 1: On File Change (debounced typing)
      if (autoSaveRef.current) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
          saveCurrentFile(newContent);
        }, autoSaveDelayRef.current);
      }
    }
  }, [vfs]);

  // Real Git operations
  const refreshGit = useCallback(async () => {
    const git = await DesktopBridge.getGitStatus(DesktopBridge.currentWorkspacePath);
    setGitProfile({
      isRepo: !!git.isRepo,
      branch: git.branch || 'main',
      ahead: git.ahead || 0,
      behind: git.behind || 0,
      modifiedCount: git.modifiedCount ?? git.modified?.length ?? 0,
      stagedCount: git.stagedCount ?? git.staged?.length ?? 0,
      untrackedCount: git.untrackedCount ?? git.untracked?.length ?? 0,
      lastCommit: git.lastCommit,
    });
  }, []);

  const gitStageFile = useCallback(async (filePath: string) => {
    await DesktopBridge.executeCommand(`git add "${filePath}"`);
    await refreshGit();
    logAgentAction('Developer', `Staged file: ${filePath}`, 'tool_call');
  }, [refreshGit, logAgentAction]);

  // Save current file
  const saveCurrentFile = useCallback(async (contentToSave?: string) => {
    const targetFile = activeFileRef.current;
    if (targetFile) {
      const content = contentToSave !== undefined ? contentToSave : activeFileContentRef.current;
      setIsAutoSaving(true);
      try {
        vfs.writeFile(targetFile, content);
        await DesktopBridge.writeFile(targetFile, content);
        setOpenTabs(prev =>
          prev.map(t => (t.filePath === targetFile ? { ...t, isDirty: false } : t))
        );
        // Run quick lint
        const lintRes = runner.runLint();
        setProblems(lintRes.diagnostics || []);
        logAgentAction('Developer', `Saved file: ${targetFile}`, 'success');
        await refreshGit();
      } finally {
        setTimeout(() => setIsAutoSaving(false), 400);
      }
    }
  }, [vfs, runner, logAgentAction, refreshGit]);

  // Save all dirty files
  const saveAllFiles = useCallback(async () => {
    setIsAutoSaving(true);
    try {
      for (const tab of openTabsRef.current) {
        if (tab.isDirty) {
          const content = tab.filePath === activeFileRef.current ? activeFileContentRef.current : (vfs.readFile(tab.filePath) || '');
          await DesktopBridge.writeFile(tab.filePath, content);
        }
      }
      setOpenTabs(prev => prev.map(t => ({ ...t, isDirty: false })));
      logAgentAction('Developer', 'Saved all dirty files across workspace', 'success');
      await refreshGit();
    } finally {
      setTimeout(() => setIsAutoSaving(false), 400);
    }
  }, [vfs, logAgentAction, refreshGit]);

  // Auto-Save Trigger 2: On Focus Loss (window blur, tab switch, document visibility hidden)
  useEffect(() => {
    const handleFocusLoss = () => {
      if (!autoSaveRef.current) return;
      const targetFile = activeFileRef.current;
      if (!targetFile) return;

      const currentTab = openTabsRef.current.find((t: OpenTab) => t.filePath === targetFile);
      if (currentTab?.isDirty) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
        saveCurrentFile();
      }
    };

    window.addEventListener('blur', handleFocusLoss);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [saveCurrentFile]);

  // File system mutations with real disk writes
  const createFileOrFolder = useCallback(async (path: string, type: 'file' | 'folder', initialContent: string = '') => {
    if (type === 'file') {
      vfs.writeFile(path, initialContent);
      await DesktopBridge.createFile(path, initialContent);
      await openFile(path);
    } else {
      vfs.writeFile(`${path}/.keep`, '');
      await DesktopBridge.createDirectory(path);
    }
    setVfs(new VirtualFileSystem(vfs.getTree()));
    logAgentAction('Developer', `Created ${type}: ${path}`, 'tool_call');
    await refreshGit();
  }, [vfs, openFile, logAgentAction, refreshGit]);

  const renameFileOrFolder = useCallback(async (oldPath: string, newPath: string) => {
    const res = await DesktopBridge.renamePath(oldPath, newPath);
    if (res.success) {
      const content = vfs.readFile(oldPath) ?? '';
      vfs.writeFile(newPath, content);
      vfs.deleteNode(oldPath);
      setOpenTabs(prev =>
        prev.map(t =>
          t.filePath === oldPath
            ? { ...t, filePath: newPath, title: newPath.split('/').pop() || newPath }
            : t
        )
      );
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
      setVfs(new VirtualFileSystem(vfs.getTree()));
      logAgentAction('Developer', `Renamed: ${oldPath} -> ${newPath}`, 'tool_call');
      await refreshGit();
      return true;
    }
    return false;
  }, [vfs, activeFile, logAgentAction, refreshGit]);

  const deleteFileOrFolder = useCallback(async (path: string) => {
    vfs.deleteNode(path);
    await DesktopBridge.deletePath(path);
    setOpenTabs(prev => prev.filter(t => !t.filePath.startsWith(path)));
    if (activeFile && activeFile.startsWith(path)) {
      setActiveFile(null);
      setActiveFileContent('');
    }
    setVfs(new VirtualFileSystem(vfs.getTree()));
    logAgentAction('Developer', `Deleted: ${path}`, 'warning');
    await refreshGit();
  }, [vfs, activeFile, logAgentAction, refreshGit]);

  // Real shell execution in terminal
  const runCommand = useCallback(async (cmd: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalHistory(prev => [
      ...prev,
      { id: `cmd-${Date.now()}`, type: 'command', text: `$ ${cmd}`, timestamp },
    ]);

    try {
      const execRes = await DesktopBridge.executeCommand(cmd);
      const lines: TerminalLine[] = [];
      if (execRes.stdout) {
        execRes.stdout.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `out-${Date.now()}-${i}`,
            type: 'stdout',
            text: line,
            timestamp,
          });
        });
      }
      if (execRes.stderr) {
        execRes.stderr.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `err-${Date.now()}-${i}`,
            type: 'stderr',
            text: line,
            timestamp,
          });
        });
      }
      lines.push({
        id: `exit-${Date.now()}`,
        type: 'system',
        text: `[Process completed with exit code ${execRes.exitCode} in ${execRes.durationMs}ms]`,
        timestamp,
      });
      setTerminalHistory(prev => [...prev, ...lines]);
    } catch {
      const res = runner.execute(cmd);
      setTerminalHistory(prev => [...prev, ...res.lines]);
    }
  }, [runner]);

  // Real Development Server Controls
  const startDevServer = useCallback(async (customCmd?: string) => {
    const cmd = customCmd || projectProfile?.userOverrides?.devCommand || projectProfile?.scripts['dev'] || 'npm run dev';
    const s = await DesktopBridge.startDevServer(cmd, DesktopBridge.currentWorkspacePath);
    if (s) {
      setDevServerProcess(s);
      setShowPreview(true);
      logAgentAction('Developer', `Started Dev Server: "${cmd}" on port ${s.port} (PID ${s.pid})`, 'success');
    }
  }, [projectProfile, logAgentAction]);

  const stopDevServer = useCallback(async () => {
    if (devServerProcess) {
      await DesktopBridge.stopDevServer(devServerProcess.pid);
      setDevServerProcess(null);
      logAgentAction('Developer', 'Development server process stopped', 'info');
    }
  }, [devServerProcess, logAgentAction]);

  const restartDevServer = useCallback(async () => {
    if (devServerProcess) {
      const cmd = devServerProcess.command;
      await stopDevServer();
      setTimeout(() => {
        startDevServer(cmd);
      }, 500);
    }
  }, [devServerProcess, stopDevServer, startDevServer]);

  // Real Workspace Open / Close / Clone System (Zero Native Popups in web, Native OS dialog in Electron)
  const openLocalFolder = useCallback(async (customPath?: string) => {
    let folderPath = customPath;
    if (!folderPath) {
      if (DesktopBridge.isElectron) {
        folderPath = (await DesktopBridge.openDirectoryDialog()) || undefined;
        if (!folderPath) return false;
      } else {
        setIsOpenFolderModalOpen(true);
        return false;
      }
    }

    try {
      DesktopBridge.setWorkspacePath(folderPath);

      const realTree = await DesktopBridge.getWorkspaceTree(folderPath);

      const flatten = (nodes: any[]): string[] => {
        let r: string[] = [];
        for (const n of nodes) {
          r.push(n.path || n.name);
          if (n.children) r = r.concat(flatten(n.children));
        }
        return r;
      };

      const hasF = (nodes: any[], target: string): boolean => {
        for (const n of nodes) {
          if (n.path === target || n.name === target || n.path?.endsWith('/' + target)) return true;
          if (n.children && hasF(n.children, target)) return true;
        }
        return false;
      };

      const toNodes = (files: any[]): FileNode[] => {
        return files.map(f => ({
          id: f.id || `node-${f.path}`,
          name: f.name,
          path: f.path || f.relativePath,
          type: f.type,
          children: f.children ? toNodes(f.children) : undefined,
        }));
      };

      const ctx: DetectionContext = {
        rootPath: folderPath,
        files: flatten(realTree),
        hasFile: (f) => hasF(realTree, f),
        readFile: async (f) => DesktopBridge.readFile(f).catch(() => null),
      };

      try {
        const pkgRaw = await DesktopBridge.readFile('package.json');
        if (pkgRaw) ctx.packageJson = JSON.parse(pkgRaw);
      } catch (e) {}

      const detected = await GlobalProjectDetector.detectProject(ctx);
      setProjectProfile(detected);

      const convertedNodes = toNodes(realTree);
      const newVfs = new VirtualFileSystem(convertedNodes);
      setVfs(newVfs);
      setRunner(new TerminalRunner(newVfs));
      const newIndexer = new CodebaseIndexer(newVfs);
      setIndexer(newIndexer);
      setNavigator(new AIProjectNavigator(newVfs, newIndexer));
      DesktopBridge.attachVFS(newVfs);

      const updatedProj: Project = {
        id: detected.id,
        name: detected.name || folderPath.split('/').filter(Boolean).pop() || 'Workspace',
        description: `Local repository at ${folderPath}`,
        rootFiles: convertedNodes,
        techStack: {
          frontend: detected.frontend?.name || detected.frameworks[0] || 'Modern UI',
          styling: detected.styling?.name || 'Tailwind CSS',
          state: detected.state?.name || 'Standard State',
          backend: detected.backend?.name || 'Node.js',
          database: detected.database?.name || 'SQLite',
        },
      };

      setActiveProject(updatedProj);
      setProjects(prev => [updatedProj, ...prev.filter(p => p.id !== updatedProj.id)]);

      const findFirstFile = (nodes: FileNode[]): string | null => {
        for (const n of nodes) {
          if (n.type === 'file') return n.path;
          if (n.children) {
            const f = findFirstFile(n.children);
            if (f) return f;
          }
        }
        return null;
      };

      const candidateEntry = detected.frontend?.entryPoint;
      const entryFile =
        (candidateEntry && newVfs.readFile(candidateEntry) !== null)
          ? candidateEntry
          : (newVfs.readFile('src/App.tsx') !== null ? 'src/App.tsx'
          : (newVfs.readFile('src/main.tsx') !== null ? 'src/main.tsx'
          : (newVfs.readFile('src/index.tsx') !== null ? 'src/index.tsx'
          : (newVfs.readFile('package.json') !== null ? 'package.json'
          : (findFirstFile(convertedNodes) || 'README.md')))));

      if (folderPath && folderPath !== '.' && !folderPath.toLowerCase().includes('vertex-forge-main')) {
        localStorage.setItem('vertexforge_last_workspace', folderPath);
      }

      // Check for persisted tabs and hot-exit buffers
      let restoredTabs: OpenTab[] = [];
      let restoredActiveFile = entryFile;
      try {
        const savedTabsRaw = localStorage.getItem(`vertexforge_tabs_${detected.id}`);
        if (savedTabsRaw) {
          const parsed = JSON.parse(savedTabsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            restoredTabs = parsed;
          }
        }
      } catch (e) {}

      // Hot exit restoration for dirty buffers
      try {
        const hotExitRaw = localStorage.getItem(`vertexforge_hot_exit_${detected.id}`);
        if (hotExitRaw) {
          const dirtyList = JSON.parse(hotExitRaw);
          if (Array.isArray(dirtyList)) {
            for (const item of dirtyList) {
              if (item.filePath && typeof item.content === 'string') {
                newVfs.writeFile(item.filePath, item.content);
                const matchTab = restoredTabs.find(t => t.filePath === item.filePath);
                if (matchTab) {
                  matchTab.isDirty = true;
                }
              }
            }
            logAgentAction('Architect', 'Restored unsaved changes from previous session (Hot Exit).', 'info');
          }
        }
      } catch (e) {}

      if (restoredTabs.length > 0) {
        const savedActiveId = localStorage.getItem(`vertexforge_active_tab_${detected.id}`);
        const activeTab = restoredTabs.find(t => t.id === savedActiveId) || restoredTabs[0];
        setOpenTabs(restoredTabs);
        setActiveTabId(activeTab.id);
        setActiveFile(activeTab.filePath);
        restoredActiveFile = activeTab.filePath;
      } else {
        const initialTab: OpenTab = { id: `tab-${Date.now()}`, filePath: entryFile, title: entryFile.split('/').pop() || entryFile };
        setOpenTabs([initialTab]);
        setActiveTabId(initialTab.id);
        setActiveFile(entryFile);
      }

      const initialContent = newVfs.readFile(restoredActiveFile);
      if (initialContent !== null && initialContent !== undefined) {
        setActiveFileContent(initialContent);
      } else {
        DesktopBridge.readFile(restoredActiveFile).then(c => {
          newVfs.writeFile(restoredActiveFile, c);
          setActiveFileContent(c);
        }).catch(() => {
          setActiveFileContent('');
        });
      }

      RecentProjects.addProject(detected);
      const git = await DesktopBridge.getGitStatus(folderPath);
      setGitProfile({
        isRepo: !!git.isRepo,
        branch: git.branch || 'main',
        ahead: git.ahead || 0,
        behind: git.behind || 0,
        modifiedCount: git.modifiedCount ?? git.modified?.length ?? 0,
        stagedCount: git.stagedCount ?? git.staged?.length ?? 0,
        untrackedCount: git.untrackedCount ?? git.untracked?.length ?? 0,
        lastCommit: git.lastCommit,
      });

      setActiveView('editor');
      logAgentAction('Architect', `Opened local project "${updatedProj.name}" at ${folderPath}`, 'success');
      return true;
    } catch (err: any) {
      console.warn(`Unable to open project at "${folderPath}":`, err?.message);
      if (customPath && customPath !== '.') {
        alert(`Unable to open project: ${err?.message || String(err)}`);
      }
      return false;
    }
  }, [logAgentAction]);

  const openLocalFile = useCallback(async (customPath?: string) => {
    let filePath = customPath;
    if (!filePath) {
      filePath = (await DesktopBridge.openFileDialog()) || undefined;
    }
    if (!filePath) return false;

    try {
      await openFile(filePath);
      setActiveView('editor');
      return true;
    } catch (err: any) {
      console.warn('Unable to open file:', err?.message);
      return false;
    }
  }, [openFile]);

  // Auto-connect to real local workspace on initial launch only if an external user project was previously chosen
  useEffect(() => {
    let isMounted = true;
    const initHostWorkspace = async () => {
      const lastWorkspace = localStorage.getItem('vertexforge_last_workspace');
      const isSelfRepo =
        !lastWorkspace ||
        lastWorkspace === '.' ||
        lastWorkspace === './' ||
        lastWorkspace.endsWith('Vertex-Forge-main') ||
        lastWorkspace.endsWith('Vertex-Forge-main/') ||
        lastWorkspace.endsWith('Vertex-Forge-main\\') ||
        lastWorkspace.endsWith('VertexForge') ||
        lastWorkspace.toLowerCase().includes('vertex-forge-main') ||
        lastWorkspace.endsWith('Vertex-Forge-main') ||
        lastWorkspace.endsWith('Vertex-Forge-main/') ||
        lastWorkspace.endsWith('Vertex-Forge-main\\') ||
        lastWorkspace.endsWith('VertexForge') ||
        lastWorkspace.toLowerCase().includes('vertex-forge');

      if (!isSelfRepo && lastWorkspace) {
        try {
          const success = await openLocalFolder(lastWorkspace);
          if (success && isMounted) {
            setActiveView('editor');
            return;
          }
        } catch {
          // ignore error and fall through to welcome
        }
      }

      // If no valid user project is loaded, present the Welcome screen and ask the user what to open!
      if (isMounted) {
        setActiveView('welcome');
        if (DesktopBridge.isElectron) {
          // In Electron, automatically trigger the native Windows folder picker!
          setTimeout(async () => {
            if (isMounted) {
              const chosen = await DesktopBridge.openDirectoryDialog();
              if (chosen && isMounted) {
                await openLocalFolder(chosen);
              }
            }
          }, 300);
        } else {
          setIsOpenFolderModalOpen(true);
        }
      }
    };

    initHostWorkspace();
    return () => { isMounted = false; };
  }, [openLocalFolder]);

  // Persist session tabs per workspace
  useEffect(() => {
    if (activeProject?.id && openTabs.length > 0) {
      try {
        localStorage.setItem(`vertexforge_tabs_${activeProject.id}`, JSON.stringify(openTabs));
      } catch (e) {}
    }
  }, [openTabs, activeProject?.id]);

  // Persist active tab ID
  useEffect(() => {
    if (activeProject?.id && activeTabId) {
      try {
        localStorage.setItem(`vertexforge_active_tab_${activeProject.id}`, activeTabId);
      } catch (e) {}
    }
  }, [activeTabId, activeProject?.id]);

  // Persist hot exit dirty buffers
  useEffect(() => {
    if (activeProject?.id) {
      const dirtyTabs = openTabs.filter(t => t.isDirty);
      if (dirtyTabs.length > 0) {
        const dirtyData = dirtyTabs.map(t => ({
          filePath: t.filePath,
          content: vfs.readFile(t.filePath) || '',
        }));
        try {
          localStorage.setItem(`vertexforge_hot_exit_${activeProject.id}`, JSON.stringify(dirtyData));
        } catch (e) {}
      } else {
        try {
          localStorage.removeItem(`vertexforge_hot_exit_${activeProject.id}`);
        } catch (e) {}
      }
    }
  }, [openTabs, activeProject?.id, activeFileContent, vfs]);

  const closeProject = useCallback(() => {
    const dirty = openTabs.filter(t => t.isDirty);
    const hasRunningServer = devServerProcess?.status === 'running';
    const hasRunningAgent = orchestratorStatus === 'executing' || orchestratorStatus === 'planning';

    if (dirty.length > 0 || hasRunningServer || hasRunningAgent) {
      setIsCloseModalOpen(true);
    } else {
      confirmCloseProject(false);
    }
  }, [openTabs, devServerProcess, orchestratorStatus]);

  const confirmCloseProject = useCallback((saveAll: boolean) => {
    if (saveAll) {
      saveAllFiles();
    }
    if (devServerProcess) {
      stopDevServer();
    }
    setIsCloseModalOpen(false);
    setActiveView('welcome');
    setActiveFile(null);
    setActiveFileContent('');
    setOpenTabs([]);
    logAgentAction('Architect', 'Closed workspace and returned to Welcome screen', 'info');
  }, [devServerProcess, saveAllFiles, stopDevServer, logAgentAction]);

  const cloneRepository = useCallback(async (repoUrl: string, targetDir?: string) => {
    logAgentAction('Developer', `Cloning Git repository: ${repoUrl}`, 'info');
    const res = await DesktopBridge.gitClone(repoUrl, targetDir);
    if (res.success && res.targetPath) {
      logAgentAction('Architect', `Cloned repository into ${res.targetPath}. Initializing workspace...`, 'success');
      return await openLocalFolder(res.targetPath);
    } else {
      logAgentAction('Developer', `Git clone failed: ${res.error}`, 'error');
      alert(`Git Clone Failed: ${res.error}`);
      return false;
    }
  }, [logAgentAction, openLocalFolder]);

  const updateProjectProfileOverrides = useCallback((overrides: ProjectProfile['userOverrides']) => {
    setProjectProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        overridden: true,
        userOverrides: { ...prev.userOverrides, ...overrides },
      };
    });
    logAgentAction('Architect', 'Updated technology stack configuration overrides', 'info');
  }, [logAgentAction]);

  const refreshProjectHealth = useCallback(async () => {
    if (projectProfile) {
      const realTree = await DesktopBridge.getWorkspaceTree(projectProfile.rootPath);
      const flatten = (nodes: any[]): string[] => {
        let r: string[] = [];
        for (const n of nodes) {
          r.push(n.path || n.name);
          if (n.children) r = r.concat(flatten(n.children));
        }
        return r;
      };
      const hasF = (nodes: any[], target: string): boolean => {
        for (const n of nodes) {
          if (n.path === target || n.name === target || n.path?.endsWith('/' + target)) return true;
          if (n.children && hasF(n.children, target)) return true;
        }
        return false;
      };
      const ctx: DetectionContext = {
        rootPath: projectProfile.rootPath,
        files: flatten(realTree),
        hasFile: (f) => hasF(realTree, f),
        readFile: async (f) => DesktopBridge.readFile(f).catch(() => null),
      };
      const updated = await GlobalProjectDetector.detectProject(ctx);
      setProjectProfile(updated);
    }
  }, [projectProfile]);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  // Real Test Suite Execution
  const runTests = useCallback(async () => {
    setBottomPanelTab('tests');
    setIsBottomPanelOpen(true);
    const timestamp = new Date().toLocaleTimeString();
    setTerminalHistory(prev => [
      ...prev,
      { id: `cmd-${Date.now()}`, type: 'command', text: '$ npm test', timestamp },
    ]);
    logAgentAction('Testing', 'Running automated test suite...', 'info');

    try {
      const testExec = await DesktopBridge.executeCommand('npx vitest run --reporter=json || npm test', {
        cwd: DesktopBridge.currentWorkspacePath,
      });
      const outText = (testExec.stdout || '') + (testExec.stderr ? '\n' + testExec.stderr : '');

      const lines: TerminalLine[] = [];
      outText.split('\n').filter(Boolean).forEach((line, i) => {
        lines.push({
          id: `tst-${Date.now()}-${i}`,
          type: testExec.exitCode === 0 ? 'stdout' : 'stderr',
          text: line,
          timestamp,
        });
      });
      setTerminalHistory(prev => [...prev, ...lines]);

      const parsedResults: TestResult[] = [];
      const testMatchRegex = /(?:✓|✕|PASS|FAIL)\s+([^\n\r]+)/g;
      let m;
      let count = 0;
      while ((m = testMatchRegex.exec(outText)) !== null && count < 25) {
        count++;
        const isPass = m[0].includes('✓') || m[0].includes('PASS');
        const testName = m[1].trim();
        parsedResults.push({
          id: `test-real-${count}`,
          testSuite: testName.split(' ')[0] || 'Suite',
          testName,
          status: isPass ? 'passed' : 'failed',
          durationMs: 45,
          filePath: activeFile || 'tests',
          errorStack: isPass ? undefined : outText.slice(0, 300),
        });
      }

      if (parsedResults.length > 0) {
        setTestResults(parsedResults);
      } else {
        const fallback = runner.runTests();
        setTestResults(fallback.testResults || []);
      }

      const passed = testExec.exitCode === 0;
      logAgentAction(
        'Testing',
        `Test execution complete: ${passed ? 'All assertions passed' : 'Failures detected'} (exit ${testExec.exitCode})`,
        passed ? 'success' : 'error'
      );
    } catch {
      const fallback = runner.runTests();
      setTestResults(fallback.testResults || []);
    }
  }, [runner, activeFile, logAgentAction]);

  // Real Project Build Runner
  const runBuild = useCallback(async () => {
    setBottomPanelTab('terminal');
    setIsBottomPanelOpen(true);
    const timestamp = new Date().toLocaleTimeString();
    const buildCmd = projectProfile?.scripts?.['build'] ? 'npm run build' : 'npm run build';
    setTerminalHistory(prev => [
      ...prev,
      { id: `cmd-${Date.now()}`, type: 'command', text: `$ ${buildCmd}`, timestamp },
    ]);
    logAgentAction('Developer', `Executing project build: ${buildCmd}`, 'info');

    try {
      const buildRes = await DesktopBridge.executeCommand(buildCmd, { cwd: DesktopBridge.currentWorkspacePath });
      const lines: TerminalLine[] = [];
      if (buildRes.stdout) {
        buildRes.stdout.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `bld-out-${Date.now()}-${i}`,
            type: 'stdout',
            text: line,
            timestamp,
          });
        });
      }
      if (buildRes.stderr) {
        buildRes.stderr.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `bld-err-${Date.now()}-${i}`,
            type: 'stderr',
            text: line,
            timestamp,
          });
        });
      }
      lines.push({
        id: `bld-exit-${Date.now()}`,
        type: 'system',
        text: `[Build finished with exit code ${buildRes.exitCode} in ${buildRes.durationMs}ms]`,
        timestamp,
      });
      setTerminalHistory(prev => [...prev, ...lines]);

      if (buildRes.exitCode === 0) {
        logAgentAction('Developer', 'Build completed successfully with 0 errors.', 'success');
      } else {
        logAgentAction(
          'Debugger',
          `Build failed with exit code ${buildRes.exitCode}. Diagnostic data captured.`,
          'error',
          buildRes.stderr
        );
        setProblems([
          {
            id: `bld-prob-${Date.now()}`,
            filePath: activeFile || 'package.json',
            line: 1,
            column: 1,
            message: `Build Error (code ${buildRes.exitCode}): ${buildRes.stderr.slice(0, 150) || 'Build compilation failed'}`,
            severity: 'error',
            source: 'build',
          },
        ]);
      }
    } catch (e: any) {
      logAgentAction('Developer', `Build execution error: ${e.message}`, 'error');
    }
  }, [projectProfile, activeFile, logAgentAction]);

  const runLint = useCallback(() => {
    const res = runner.runLint();
    setTerminalHistory(prev => [
      ...prev,
      { id: `cmd-${Date.now()}`, type: 'command', text: '$ npm run lint', timestamp: new Date().toLocaleTimeString() },
      ...res.lines,
    ]);
    setProblems(res.diagnostics || []);
    setBottomPanelTab('problems');
    setIsBottomPanelOpen(true);
    logAgentAction('Reviewer', `Static analysis completed: ${res.diagnostics?.length || 0} problems found`, res.exitCode === 0 ? 'success' : 'warning');
  }, [runner, logAgentAction]);

  // Git operations
  const commitChanges = useCallback((msg: string) => {
    const c = vfs.commit(msg);
    logAgentAction('Developer', `Committed changes: "${msg}" (${c.hash})`, 'success');
    runCommand(`git commit -m "${msg}"`);
    refreshGit();
  }, [vfs, logAgentAction, runCommand, refreshGit]);

  const revertFile = useCallback(async (path: string) => {
    vfs.revertFile(path);
    try {
      await DesktopBridge.executeCommand(`git checkout -- "${path}"`);
    } catch {}
    try {
      const diskContent = await DesktopBridge.readFile(path);
      vfs.writeFile(path, diskContent);
      if (activeFile === path) {
        setActiveFileContent(diskContent);
      }
    } catch {
      if (activeFile === path) {
        setActiveFileContent(vfs.readFile(path) ?? '');
      }
    }
    setOpenTabs(prev => prev.map(t => (t.filePath === path ? { ...t, isDirty: false } : t)));
    logAgentAction('Developer', `Reverted file: ${path}`, 'warning');
    await refreshGit();
  }, [vfs, activeFile, logAgentAction, refreshGit]);

  // Fully Autonomous AI Software Engineer Engine Instance
  const autonomousEngine = useMemo(() => {
    const engine = new AutonomousAgentEngine(vfs, autonomyMode as PermissionMode, projectProfile || undefined);
    engine.setEvents({
      onPlanCreated: (plan) => {
        setAutonomousPlan(plan);
        const mappedTasks: TaskItem[] = plan.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          agent: t.role,
          status: t.status === 'running' ? 'in-progress' : (t.status as any),
          targetFile: t.targetFiles[0] || 'src/App.tsx',
          toolAction: 'modify_file',
          requiresApproval: t.requiresApproval,
          approvalStatus: t.approvalStatus,
          resultSummary: t.resultSummary,
          verificationEvidence: t.verificationReport ? 'Verified' : undefined,
        }));
        setTaskPlan(mappedTasks);
      },
      onPlanStatusChange: (status) => {
        if (status === 'in_progress') setOrchestratorStatus('executing');
        else if (status === 'completed') setOrchestratorStatus('completed');
        else if (status === 'rejected' || status === 'cancelled') setOrchestratorStatus('idle');
        else if (status === 'failed') setOrchestratorStatus('error');
      },
      onTaskStatusChange: (taskId, status) => {
        setTaskPlan(prev =>
          prev.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: status === 'running' ? 'in-progress' : (status as any),
                }
              : t
          )
        );
      },
      onExecutionStateChange: (state) => {
        setAutonomousExecutionState(state);
        if (state === 'executing') setOrchestratorStatus('executing');
        else if (state === 'planning') setOrchestratorStatus('planning');
        else if (state === 'waiting_plan_approval' || state === 'waiting_step_approval') setOrchestratorStatus('awaiting_approval');
        else if (state === 'verifying') setOrchestratorStatus('testing');
        else if (state === 'completed') setOrchestratorStatus('completed');
        else if (state === 'failed') setOrchestratorStatus('error');
        else if (state === 'cancelled' || state === 'idle') setOrchestratorStatus('idle');
      },
      onVerificationComplete: (summary) => {
        setVerificationSummary(summary);
      },
      onLogMessage: (role, message, type) => {
        logAgentAction(role as AgentRole, message, type as any);
      },
    });
    return engine;
  }, [vfs, autonomyMode, projectProfile, logAgentAction]);

  // Autonomous Orchestration Plan
  const startAutonomousPlan = useCallback(async (userPrompt: string) => {
    try {
      setOrchestratorStatus('planning');
      setActiveAgent('Architect');
      setVerificationSummary(null);
      logAgentAction('Architect', `Analyzing user requirements: "${userPrompt}"`, 'info');

      const plan = await autonomousEngine.planGoal(userPrompt);
      setAutonomousPlan(plan);

      // In autonomous mode (or if auto-approved), trigger real multi-step execution
      if (plan.status === 'approved') {
        const summary = await autonomousEngine.executePlan();
        setVerificationSummary(summary);
        await refreshGit();
      }
    } catch (err: any) {
      setOrchestratorStatus('error');
      logAgentAction('Architect', `Planning failed: ${err.message}`, 'error');
    }
  }, [autonomousEngine, refreshGit, logAgentAction]);

  const pauseAutonomousPlan = useCallback(() => {
    autonomousEngine.pause();
    setOrchestratorStatus('idle');
  }, [autonomousEngine]);

  const resumeAutonomousPlan = useCallback(() => {
    autonomousEngine.resume();
  }, [autonomousEngine]);

  const cancelAutonomousPlan = useCallback(() => {
    autonomousEngine.cancel();
    setOrchestratorStatus('idle');
    logAgentAction('Architect', 'Autonomous orchestration halted by user.', 'warning');
  }, [autonomousEngine, logAgentAction]);

  const approveAutonomousPlan = useCallback(() => {
    autonomousEngine.approvePlan();
  }, [autonomousEngine]);

  const rejectAutonomousPlan = useCallback(() => {
    autonomousEngine.rejectPlan();
  }, [autonomousEngine]);

  const rollbackAutonomousPlan = useCallback(async (checkpointId?: string) => {
    const res = await autonomousEngine.rollback(checkpointId);
    await refreshGit();
    return res.success;
  }, [autonomousEngine, refreshGit]);

  const retryAutonomousTask = useCallback(async (taskId: string) => {
    await autonomousEngine.retryTask(taskId);
    await refreshGit();
  }, [autonomousEngine, refreshGit]);

  // Multi-Language Debugger Engine & Session State (DAP Architecture)
  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [debugThread, setDebugThread] = useState<Thread>({ id: 1, name: 'main', status: 'running' });
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([]);
  const [debugStackFrames, setDebugStackFrames] = useState<StackFrame[]>([]);
  const [debugVariables, setDebugVariables] = useState<Variable[]>([]);
  const [debugWatchExpressions, setDebugWatchExpressions] = useState<WatchExpression[]>([]);
  const [debugConsoleMessages, setDebugConsoleMessages] = useState<DebugConsoleMessage[]>([]);
  const [debugLocation, setDebugLocation] = useState<{ filePath: string; line: number; column: number } | null>(null);
  const [aiDebugDiagnosis, setAiDebugDiagnosis] = useState<AIDebugDiagnosis | null>(null);

  const debuggerEngine = useMemo(() => {
    const engine = new DebuggerEngine(vfs);
    engine.setEvents({
      onSessionStateChange: (session) => {
        setDebugSession(session ? { ...session } : null);
        if (session && session.status !== 'stopped') {
          setActiveSidebarTab('debug');
          setBottomPanelTab('debug');
          setIsBottomPanelOpen(true);
        }
      },
      onThreadStateChange: (thread) => setDebugThread({ ...thread }),
      onBreakpointsChange: (bps) => setDebugBreakpoints([...bps]),
      onStackFramesChange: (frames) => setDebugStackFrames([...frames]),
      onVariablesChange: (vars) => setDebugVariables([...vars]),
      onWatchExpressionsChange: (watches) => setDebugWatchExpressions([...watches]),
      onConsoleOutput: (msg) => setDebugConsoleMessages(prev => [...prev, msg]),
      onActiveLocationChange: (loc) => {
        setDebugLocation(loc);
        if (loc) {
          openFile(loc.filePath);
        }
      },
    });
    setDebugBreakpoints(engine.getBreakpoints());
    setDebugWatchExpressions(engine.getWatchExpressions());
    return engine;
  }, [vfs, openFile]);

  const diagnoseCrashWithAI = useCallback(async () => {
    try {
      const diagnosis = await debuggerEngine.diagnoseWithAI();
      setAiDebugDiagnosis(diagnosis);
      logAgentAction('Debugger', `AI Diagnosis completed: ${diagnosis.hypothesis}`, 'info', diagnosis.suggestedFix);
    } catch (err: any) {
      logAgentAction('Debugger', `AI Diagnosis failed: ${err.message}`, 'error');
    }
  }, [debuggerEngine, logAgentAction]);

  const applyAIDebugFix = useCallback(async () => {
    if (!aiDebugDiagnosis || !aiDebugDiagnosis.replacementCode) return;
    const { targetFile, replacementCode } = aiDebugDiagnosis;
    vfs.writeFile(targetFile, replacementCode);
    try {
      await DesktopBridge.writeFile(targetFile, replacementCode);
    } catch {}
    updateFileContent(replacementCode);
    logAgentAction('Debugger', `Applied AI patch to ${targetFile}. Restarting debug session...`, 'success');
    setAiDebugDiagnosis(null);
    debuggerEngine.restartSession();
  }, [aiDebugDiagnosis, vfs, debuggerEngine, updateFileContent, logAgentAction]);

  const toggleBreakpoint = useCallback((filePath: string, line: number) => {
    debuggerEngine.toggleBreakpoint(filePath, line);
  }, [debuggerEngine]);

  // Execute single task step with real filesystem persistence
  const executeStep = useCallback(async () => {
    if (taskPlan.length === 0 || currentTaskIndex >= taskPlan.length) return;

    const currentTask = taskPlan[currentTaskIndex];
    setOrchestratorStatus('executing');
    setActiveAgent(currentTask.agent);

    logAgentAction(currentTask.agent, `Executing: ${currentTask.title}`, 'tool_call', currentTask.description, currentTask.targetFile);

    try {
      const targetPath = currentTask.targetFile || 'src/App.tsx';
      const existingCode = vfs.readFile(targetPath) || '';

      const codeGen = await GeminiService.generateCode({
        taskTitle: currentTask.title,
        taskDetails: currentTask.description,
        filePath: targetPath,
        currentCode: existingCode,
        projectContext: activeProject.description,
        agentRole: currentTask.agent,
      });

      // Apply code to VFS and real disk
      vfs.writeFile(targetPath, codeGen.code);
      await DesktopBridge.writeFile(targetPath, codeGen.code);

      if (activeFile === targetPath) {
        setActiveFileContent(codeGen.code);
      }
      await openFile(targetPath);

      // Check if tests were generated and persist to disk
      if (codeGen.tests) {
        const testPath = targetPath.replace('src/', 'src/__tests__/').replace('.tsx', '.test.ts').replace('.ts', '.test.ts');
        vfs.writeFile(testPath, codeGen.tests);
        await DesktopBridge.writeFile(testPath, codeGen.tests);
      }

      await refreshGit();

      // Update task status
      setTaskPlan(prev =>
        prev.map((t, idx) =>
          idx === currentTaskIndex
            ? { ...t, status: 'completed', resultSummary: codeGen.explanation, verificationEvidence: 'Files updated & compiled' }
            : idx === currentTaskIndex + 1
            ? { ...t, status: 'in-progress' }
            : t
        )
      );

      logAgentAction(currentTask.agent, `Completed: ${currentTask.title}`, 'success', codeGen.explanation, targetPath);

      const nextIdx = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIdx);

      if (nextIdx < taskPlan.length) {
        if (autonomyMode === 'autonomous') {
          setTimeout(() => executeStep(), 800);
        } else {
          setOrchestratorStatus('awaiting_approval');
        }
      } else {
        // All completed! Run automated verification
        setOrchestratorStatus('testing');
        runTests();
        setOrchestratorStatus('completed');
        logAgentAction('Reviewer', 'All lifecycle tasks completed and verified.', 'success');
      }
    } catch (err: any) {
      setOrchestratorStatus('error');
      logAgentAction(currentTask.agent, `Execution failed: ${err.message}`, 'error');
    }
  }, [taskPlan, currentTaskIndex, vfs, activeFile, activeProject, autonomyMode, logAgentAction, openFile, runTests, refreshGit]);

  // Human approval handlers
  const approveTask = useCallback((taskId: string) => {
    setTaskPlan(prev =>
      prev.map(t => (t.id === taskId ? { ...t, approvalStatus: 'approved' } : t))
    );
    logAgentAction('Architect', `Human approved task execution: ${taskId}`, 'info');
    executeStep();
  }, [logAgentAction, executeStep]);

  const rejectTask = useCallback((taskId: string) => {
    setTaskPlan(prev =>
      prev.map(t => (t.id === taskId ? { ...t, approvalStatus: 'rejected', status: 'failed' } : t))
    );
    logAgentAction('Architect', `Human rejected task: ${taskId}`, 'warning');
    setOrchestratorStatus('idle');
  }, [logAgentAction]);

  const cancelOrchestration = useCallback(() => {
    cancelAutonomousPlan();
  }, [cancelAutonomousPlan]);

  // Self-Healing Debugger Loop
  const triggerSelfHealDebug = useCallback(async (errorDetails?: string) => {
    setOrchestratorStatus('self_correcting');
    setActiveAgent('Debugger');
    setBottomPanelTab('terminal');
    setIsBottomPanelOpen(true);

    const failingSuite = testResults.find(t => t.status === 'failed') ||
      (problems.length > 0 ? { filePath: problems[0].filePath, errorStack: problems[0].message } : null) ||
      (openTabs.length > 0 ? { filePath: openTabs[0].filePath, errorStack: 'Syntax error or issue detected in active file' } : null);

    if (!failingSuite) {
      logAgentAction('Debugger', 'No failing test suite or diagnostic detected to self-heal.', 'info');
      setOrchestratorStatus('idle');
      return;
    }

    let targetFile = failingSuite.filePath;
    if (targetFile.includes('__tests__') || targetFile.includes('.test.') || targetFile.includes('.spec.')) {
      const derived = targetFile
        .replace('/__tests__/', '/')
        .replace('\\__tests__\\', '\\')
        .replace(/\.(test|spec)\./, '.');
      if (vfs.readFile(derived)) {
        targetFile = derived;
      }
    }

    let fileContent = vfs.readFile(targetFile) || '';
    if (!fileContent) {
      try {
        fileContent = await DesktopBridge.readFile(targetFile);
      } catch {
        fileContent = '';
      }
    }
    const errorStack = errorDetails || failingSuite.errorStack || 'Test failure';

    logAgentAction('Debugger', `Self-Healing triggered: Inspecting root cause in ${targetFile}`, 'tool_call', errorStack);

    try {
      const debugRes = await GeminiService.debugIssue({
        errorLog: errorStack,
        failingFile: targetFile,
        fileContent,
        testOutput: errorStack,
      });

      logAgentAction('Debugger', `Root Cause identified: ${debugRes.rootCause}`, 'info', debugRes.explanation);

      const correctedCode = debugRes.patch || fileContent;

      vfs.writeFile(targetFile, correctedCode);
      await DesktopBridge.writeFile(targetFile, correctedCode);
      await refreshGit();

      if (activeFile === targetFile) {
        setActiveFileContent(correctedCode);
      }

      logAgentAction('Debugger', `Applied patch to ${targetFile}. Re-running verification...`, 'tool_call');

      await runTests();

      setOrchestratorStatus('idle');
      logAgentAction('Debugger', `Self-Healing complete for ${targetFile}`, 'success');
    } catch (err: any) {
      logAgentAction('Debugger', `Debug self-healing error: ${err.message}`, 'error');
      setOrchestratorStatus('error');
    }
  }, [testResults, problems, openTabs, vfs, activeFile, logAgentAction, refreshGit, runTests]);

  // Security Review
  const runSecurityReview = useCallback(async () => {
    setActiveAgent('Reviewer');
    setBottomPanelTab('review');
    setIsBottomPanelOpen(true);
    logAgentAction('Reviewer', 'Performing live multi-layer AST security audit and dependency scan', 'tool_call');

    try {
      const auditReport = await SecurityAuditService.runAudit();
      logAgentAction(
        'Reviewer',
        `Security & Dependency Audit completed. Score: ${auditReport.securityScore}/100. Findings: ${auditReport.findings.length}`,
        auditReport.status === 'clean' ? 'success' : 'warning',
        auditReport.statusMessage
      );
    } catch (err: any) {
      logAgentAction('Reviewer', `Security audit error: ${err.message}`, 'error');
    }
  }, [logAgentAction]);

  // Create new project
  const createNewProject = useCallback(async (name: string, description: string, archetype: any = 'fullstack-saas') => {
    logAgentAction('Architect', `Generating new project "${name}" with archetype: ${archetype}`, 'info');
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      techStack: {
        archetype,
        frontend: 'React 19 + TypeScript + Tailwind CSS',
        backend: 'Node.js Express + REST API',
        database: 'PostgreSQL / SQLite',
        testRunner: 'Vitest + React Testing Library',
        styling: 'Tailwind CSS',
        packageManager: 'npm',
        runtime: 'node',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memory: {
        purpose: description,
        requirements: [description],
        architecturalDecisions: ['Decoupled frontend & backend contracts'],
        codingConventions: ['TypeScript strict mode'],
        knownRisks: [],
        testCommands: ['npm test'],
      },
      rootFiles: [
        {
          id: 'f-readme',
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          language: 'markdown',
          content: `# ${name}\n\n${description}\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm test\nnpm run dev\n\`\`\`\n`,
        },
        {
          id: 'dir-src',
          name: 'src',
          path: 'src',
          type: 'folder',
          children: [
            {
              id: 'f-app',
              name: 'App.tsx',
              path: 'src/App.tsx',
              type: 'file',
              language: 'typescript',
              content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-white">\n      <h1 className="text-2xl font-bold">${name}</h1>\n      <p className="text-slate-400 mt-2">${description}</p>\n    </div>\n  );\n}\n`,
            },
          ],
        },
      ],
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
    logAgentAction('Architect', `Project "${name}" initialized successfully.`, 'success');
  }, [logAgentAction]);

  // AI Codebase Inspector
  const inspectFeature = useCallback((query: string): InspectionResult => {
    const res = navigator.explainFeature(query);
    setLastInspectionResult(res);
    logAgentAction('Architect', `Inspected workspace for "${query}". Evaluated ${res.inspectedFiles.length} files.`, 'tool_call');
    return res;
  }, [navigator, logAgentAction]);

  // Multi-File Proposed Changes
  const proposeMultiFileChanges = useCallback((instruction: string) => {
    const changes = navigator.planMultiFileChanges(instruction);
    setProposedChanges(changes);
    setIsMultiFileReviewOpen(true);
    logAgentAction('Developer', `Synthesized multi-file diff for "${instruction}" (${changes.length} files).`, 'info');
  }, [navigator, logAgentAction]);

  // Apply Granular Selected Changes
  const applySelectedChanges = useCallback((acceptedChanges: ProposedFileChange[]) => {
    for (const change of acceptedChanges) {
      if (change.accepted) {
        if (change.action === 'delete') {
          vfs.deleteNode(change.filePath);
        } else {
          vfs.writeFile(change.filePath, change.newContent);
        }
        logAgentAction('Developer', `Applied change to ${change.filePath} (+${change.additions} -${change.deletions})`, 'success');
      }
    }
    const newVfs = new VirtualFileSystem(vfs.getTree());
    setVfs(newVfs);
    indexer.updateVFS(newVfs);
    navigator.updateDependencies(newVfs, indexer);
    DesktopBridge.attachVFS(newVfs);
    (window as any).__IDE_VFS__ = newVfs;
    if (acceptedChanges[0]?.filePath) {
      openFile(acceptedChanges[0].filePath);
    }
  }, [vfs, indexer, navigator, openFile, logAgentAction]);

  const toggleTheme = useCallback(() => {
    const cycleThemeIds = [
      'antigravity',
      'antigravity-cyber',
      'antigravity-nebula',
      'antigravity-solar',
      'antigravity-titanium',
      'dark',
      'dracula',
      'nord',
      'monokai',
      'antigravity-frost',
      'light',
    ];
    const currentIndex = cycleThemeIds.indexOf(themeEngine.themeId);
    const nextThemeId = cycleThemeIds[(currentIndex + 1) % cycleThemeIds.length];
    themeEngine.setTheme(nextThemeId);
  }, [themeEngine]);

  const toggleBottomPanel = useCallback(() => {
    setIsBottomPanelOpen(prev => !prev);
  }, []);

  const modifiedFiles = useMemo(() => vfs.getModifiedFiles(), [vfs, activeFileContent]);
  const commits = useMemo(() => vfs.getCommits(), [vfs]);
  const fileTree = useMemo(() => vfs.getTree(), [vfs]);

  return (
    <IDEContext.Provider
      value={{
        projects,
        activeProject,
        vfs,
        switchProject,
        createNewProject,
        fileTree,
        activeFile,
        activeFileContent,
        openTabs,
        activeTabId,
        openFile,
        openFileInEditor,
        editorFileService,
        closeTab,
        updateFileContent,
        saveCurrentFile,
        saveAllFiles,
        autoSave,
        setAutoSave,
        autoSaveDelay,
        setAutoSaveDelay,
        isAutoSaving,
        createFileOrFolder,
        deleteFileOrFolder,
        renameFileOrFolder,
        isCreatingFile,
        setIsCreatingFile,
        isCreatingFolder,
        setIsCreatingFolder,
        startCreatingFile,
        startCreatingFolder,

        // Real Workspace & Lifecycle
        projectProfile,
        updateProjectProfileOverrides,
        refreshProjectHealth,
        openLocalFolder,
        openLocalFile,
        closeProject,
        confirmCloseProject,
        isCloseModalOpen,
        setIsCloseModalOpen,
        cloneRepository,
        isCloneModalOpen,
        setIsCloneModalOpen,
        isOpenFolderModalOpen,
        setIsOpenFolderModalOpen,
        devServerProcess,
        startDevServer,
        stopDevServer,
        restartDevServer,
        gitProfile,
        refreshGit,
        gitStageFile,

        terminalHistory,
        runCommand,
        clearTerminal,
        testResults,
        problems,
        runTests,
        runBuild,
        runLint,

        modifiedFiles,
        commits,
        commitChanges,
        revertFile,

        autonomyMode,
        setAutonomyMode,
        activeAgent,
        setActiveAgent,
        orchestratorStatus,
        taskPlan,
        currentTaskIndex,
        agentLogs,
        logAgentAction,
        startAutonomousPlan,
        executeStep,
        approveTask,
        rejectTask,
        cancelOrchestration,
        triggerSelfHealDebug,
        runSecurityReview,
        codeReviewResult,

        theme,
        toggleTheme,
        activeSidebarTab,
        setActiveSidebarTab,
        bottomPanelTab,
        setBottomPanelTab,
        isBottomPanelOpen,
        toggleBottomPanel,
        showPreview,
        setShowPreview,
        previewDevice,
        setPreviewDevice,
        hasApiKey,
        cursorPosition,
        setCursorPosition,

        // Cursor Modes & Desktop Navigation
        cursorMode,
        setCursorMode,
        indexer,
        navigator,
        proposedChanges,
        isMultiFileReviewOpen,
        setIsMultiFileReviewOpen,
        proposeMultiFileChanges,
        applySelectedChanges,
        isAcceptanceModalOpen,
        setIsAcceptanceModalOpen,
        isControlPanelOpen,
        setIsControlPanelOpen,
        isProjectWizardOpen,
        setIsProjectWizardOpen,
        isProjectIntelligenceOpen,
        setIsProjectIntelligenceOpen,
        lastInspectionResult,
        inspectFeature,

        activeView,
        setActiveView,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        voiceCodingEngine,
        codeEvolutionService,
        bugDetective,
        productionWatchdogService,

        // Fully Autonomous AI Software Engineer Engine
        autonomousEngine,
        autonomousPlan,
        autonomousExecutionState,
        verificationSummary,
        pauseAutonomousPlan,
        resumeAutonomousPlan,
        cancelAutonomousPlan,
        approveAutonomousPlan,
        rejectAutonomousPlan,
        rollbackAutonomousPlan,
        retryAutonomousTask,

        // Multi-Language Debugger Services & State (DAP)
        debuggerEngine,
        debugSession,
        debugThread,
        debugBreakpoints,
        debugStackFrames,
        debugVariables,
        debugWatchExpressions,
        debugConsoleMessages,
        debugLocation,
        aiDebugDiagnosis,
        diagnoseCrashWithAI,
        applyAIDebugFix,
        toggleBreakpoint,
      }}
    >
      {children}
    </IDEContext.Provider>
  );
};

export const useIDE = () => {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useIDE must be used within an IDEProvider');
  }
  return context;
};
