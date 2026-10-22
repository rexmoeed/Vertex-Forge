import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
import { ProjectProfile, DevServerProcess, GitProfile } from '../types/project';
import { CodebaseIndexer } from '../services/codebaseIndexer';
import { AIProjectNavigator } from '../services/aiNavigator';
import { DesktopBridge } from '../services/desktopBridge';
import { OpenFileRequest, EditorFileService, editorFileService } from '../services/editorFileService';
import { voiceCodingEngine, VoiceCodingEngine } from '../services/voiceCodingEngine';
import { codeEvolutionService, ConcreteCodeEvolutionService } from '../services/codeEvolutionService';
import { bugDetective, ConcreteBugDetective } from '../services/bugDetectiveService';
import { productionWatchdogService, ProductionWatchdogService } from '../services/productionWatchdogService';
import { AutonomousAgentEngine } from '../services/autonomousAgentEngine';
import { AutonomousPlan, AutonomousExecutionState, VerificationSummary } from '../types/autonomousAgent';
import { DebuggerEngine } from '../services/debuggerEngine';
import {
  Breakpoint,
  StackFrame,
  Variable,
  WatchExpression,
  Thread,
  DebugSession,
  DebugConsoleMessage,
  AIDebugDiagnosis,
} from '../types/debugger';
import { useTheme } from './ThemeContext';
import { UIProvider, useUI, CursorMode, IDEActiveView } from './UIContext';
import { GitProvider, useGit } from './GitContext';
import { AgentProvider, useAgent } from './AgentContext';
import { WorkspaceLifecycleService } from '../services/workspaceLifecycleService';
import { IDEBuildRunner } from '../services/ideBuildRunner';

export type { CursorMode, IDEActiveView };

export interface IDEContextType {
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
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

  terminalHistory: TerminalLine[];
  runCommand: (cmd: string) => void;
  clearTerminal: () => void;
  testResults: TestResult[];
  problems: ProblemDiagnostic[];
  runTests: () => void;
  runBuild: () => Promise<void>;
  runLint: () => void;

  modifiedFiles: GitDiff[];
  commits: GitCommit[];
  commitChanges: (msg: string) => void;
  revertFile: (path: string) => void;

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
  cursorPosition: { line: number; column: number };
  setCursorPosition: (pos: { line: number; column: number }) => void;
  isProjectIntelligenceOpen: boolean;
  setIsProjectIntelligenceOpen: (val: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  voiceCodingEngine: VoiceCodingEngine;
  codeEvolutionService: ConcreteCodeEvolutionService;
  bugDetective: ConcreteBugDetective;
  productionWatchdogService: ProductionWatchdogService;

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
const IDEInternalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ui = useUI();
  const agent = useAgent();
  const git = useGit();
  const themeEngine = useTheme();

  const [projects, setProjects] = useState<Project[]>([DEFAULT_WORKSPACE]);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_WORKSPACE);
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
  const [devServerProcess, setDevServerProcess] = useState<DevServerProcess | null>(null);

  const [vfs, setVfs] = useState<VirtualFileSystem>(() => new VirtualFileSystem([]));
  const [runner, setRunner] = useState<TerminalRunner>(() => new TerminalRunner(vfs));
  const [indexer, setIndexer] = useState<CodebaseIndexer>(() => new CodebaseIndexer(vfs));
  const [navigator, setNavigator] = useState<AIProjectNavigator>(() => new AIProjectNavigator(vfs, indexer));

  const [proposedChanges, setProposedChanges] = useState<ProposedFileChange[]>([]);
  const [lastInspectionResult, setLastInspectionResult] = useState<InspectionResult | null>(null);

  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('vertexforge_autosave');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });
  const [autoSaveDelay, setAutoSaveDelay] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('vertexforge_autosave_delay');
      return stored ? parseInt(stored, 10) : 1000;
    } catch {
      return 1000;
    }
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

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
  const [codeReviewResult] = useState<AICodeReviewResponse | null>(null);

  const [debugSession, setDebugSession] = useState<DebugSession | null>(null);
  const [debugThread, setDebugThread] = useState<Thread>({ id: 1, name: 'main', status: 'running' });
  const [debugBreakpoints, setDebugBreakpoints] = useState<Breakpoint[]>([]);
  const [debugStackFrames, setDebugStackFrames] = useState<StackFrame[]>([]);
  const [debugVariables, setDebugVariables] = useState<Variable[]>([]);
  const [debugWatchExpressions, setDebugWatchExpressions] = useState<WatchExpression[]>([]);
  const [debugConsoleMessages, setDebugConsoleMessages] = useState<DebugConsoleMessage[]>([]);
  const [debugLocation, setDebugLocation] = useState<{ filePath: string; line: number; column: number } | null>(null);
  const [aiDebugDiagnosis, setAiDebugDiagnosis] = useState<AIDebugDiagnosis | null>(null);

  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const startCreatingFile = useCallback(() => {
    ui.setActiveView('editor');
    ui.setActiveSidebarTab('explorer');
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
  }, [ui]);

  const startCreatingFolder = useCallback(() => {
    ui.setActiveView('editor');
    ui.setActiveSidebarTab('explorer');
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
  }, [ui]);

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
  }, [activeProject.id]);

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

  useEffect(() => {
    GeminiService.checkHealth().then(res => {
      setHasApiKey(res.hasApiKey);
    });
  }, []);

  const openFileInEditor = useCallback(async (request: OpenFileRequest | string, diffMode: boolean = false): Promise<OpenTab> => {
    const req: OpenFileRequest = typeof request === 'string'
      ? { workspaceId: activeProject.id, path: request, source: 'explorer', diffMode }
      : request;

    const normalizedPath = req.path.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || normalizedPath;
    const language = editorFileService.detectLanguage(normalizedPath);

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

    if (req.line) {
      ui.setCursorPosition({ line: req.line, column: req.column || 1 });
    }

    if (existingTab) {
      setActiveTabId(existingTab.id);
      setActiveFile(normalizedPath);
      setActiveFileContent(content);
      ui.setActiveView('editor');
      agent.logAgentAction('Developer', `Activated tab "${existingTab.title}"`, 'info');
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
      ui.setActiveView('editor');
      agent.logAgentAction('Developer', `Opened "${newTab.title}" in editor`, 'info');
      return newTab;
    }
  }, [openTabs, vfs, activeProject.id, ui, agent]);

  const openFile = useCallback(async (path: string | OpenFileRequest, diffMode: boolean = false) => {
    return openFileInEditor(path, diffMode);
  }, [openFileInEditor]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const nextTab = filtered[filtered.length - 1];
        if (nextTab) {
          setActiveTabId(nextTab.id);
          setActiveFile(nextTab.filePath);
          const c = vfs.readFile(nextTab.filePath);
          if (c !== null && c !== undefined) setActiveFileContent(c);
        } else {
          setActiveTabId(null);
          setActiveFile(null);
          setActiveFileContent('');
        }
      }
      return filtered;
    });
  }, [activeTabId, vfs]);

  const updateFileContent = useCallback((newContent: string) => {
    setActiveFileContent(newContent);
    if (activeFile) {
      vfs.writeFile(activeFile, newContent);
      setOpenTabs(prev => prev.map(t => t.filePath === activeFile ? { ...t, isDirty: true } : t));
    }
  }, [activeFile, vfs]);

  const saveCurrentFile = useCallback(async () => {
    if (activeFile) {
      setIsAutoSaving(true);
      await DesktopBridge.writeFile(activeFile, activeFileContent);
      setOpenTabs(prev => prev.map(t => t.filePath === activeFile ? { ...t, isDirty: false } : t));
      setIsAutoSaving(false);
      git.refreshGit();
    }
  }, [activeFile, activeFileContent, git]);

  const saveAllFiles = useCallback(async () => {
    const dirty = openTabs.filter(t => t.isDirty);
    for (const tab of dirty) {
      const content = vfs.readFile(tab.filePath);
      if (content !== null && content !== undefined) {
        await DesktopBridge.writeFile(tab.filePath, content);
      }
    }
    setOpenTabs(prev => prev.map(t => ({ ...t, isDirty: false })));
    git.refreshGit();
  }, [openTabs, vfs, git]);

  const createFileOrFolder = useCallback(async (path: string, type: 'file' | 'folder', initialContent: string = '') => {
    if (type === 'file') {
      vfs.writeFile(path, initialContent);
      await DesktopBridge.writeFile(path, initialContent);
      await openFile(path);
    } else {
      vfs.writeFile(`${path}/.keep`, '');
      await DesktopBridge.createDirectory(path);
    }
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    git.refreshGit();
  }, [vfs, openFile, git]);

  const renameFileOrFolder = useCallback(async (oldPath: string, newPath: string) => {
    const content = vfs.readFile(oldPath) ?? '';
    vfs.writeFile(newPath, content);
    vfs.deleteNode(oldPath);
    setOpenTabs(prev => prev.map(t => t.filePath === oldPath ? { ...t, filePath: newPath, title: newPath.split('/').pop() || newPath } : t));
    if (activeFile === oldPath) setActiveFile(newPath);
    git.refreshGit();
    return true;
  }, [vfs, activeFile, git]);

  const deleteFileOrFolder = useCallback(async (path: string) => {
    vfs.deleteNode(path);
    await DesktopBridge.deletePath(path);
    setOpenTabs(prev => prev.filter(t => !t.filePath.startsWith(path)));
    if (activeFile === path) {
      setActiveFile(null);
      setActiveFileContent('');
    }
    git.refreshGit();
  }, [vfs, activeFile, git]);
  const switchProject = useCallback((projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setActiveProject(proj);
      agent.logAgentAction('Architect', `Switched workspace to project: ${proj.name}`, 'info');
    }
  }, [projects, agent]);

  const openLocalFolder = useCallback(async (customPath?: string): Promise<boolean> => {
    let folderPath = customPath;
    if (!folderPath) {
      if (DesktopBridge.isElectron) {
        folderPath = (await DesktopBridge.openDirectoryDialog()) || undefined;
        if (!folderPath) return false;
      } else {
        ui.setIsOpenFolderModalOpen(true);
        return false;
      }
    }

    try {
      const res = await WorkspaceLifecycleService.openLocalFolder(folderPath, agent.logAgentAction);
      setActiveProject(res.project);
      setProjectProfile(res.profile);
      setProjects(prev => [res.project, ...prev.filter(p => p.id !== res.project.id)]);
      setVfs(res.services.vfs);
      setRunner(res.services.runner);
      setIndexer(res.services.indexer);
      setNavigator(res.services.navigator);
      setOpenTabs(res.openTabs);
      setActiveTabId(res.openTabs[0]?.id || null);
      setActiveFile(res.activeFile);
      setActiveFileContent(res.initialContent);
      ui.setActiveView('editor');
      return true;
    } catch (err: any) {
      agent.logAgentAction('Architect', `Failed to open project: ${err?.message || String(err)}`, 'error');
      return false;
    }
  }, [ui, agent]);

  const openLocalFile = useCallback(async (customPath?: string): Promise<boolean> => {
    let filePath = customPath;
    if (!filePath) {
      filePath = (await DesktopBridge.openFileDialog()) || undefined;
    }
    if (!filePath) return false;
    try {
      await openFile(filePath);
      ui.setActiveView('editor');
      return true;
    } catch {
      return false;
    }
  }, [openFile, ui]);

  const closeProject = useCallback(() => {
    ui.setIsCloseModalOpen(true);
  }, [ui]);

  const confirmCloseProject = useCallback((saveAll: boolean) => {
    if (saveAll) saveAllFiles();
    setOpenTabs([]);
    setActiveFile(null);
    setActiveFileContent('');
    ui.setIsCloseModalOpen(false);
    ui.setActiveView('welcome');
  }, [saveAllFiles, ui]);

  const cloneRepository = useCallback(async (repoUrl: string, targetDir?: string): Promise<boolean> => {
    const res = await git.cloneRepository(repoUrl, targetDir);
    if (res.success && res.targetPath) {
      await openLocalFolder(res.targetPath);
      return true;
    }
    return false;
  }, [git, openLocalFolder]);

  const updateProjectProfileOverrides = useCallback((overrides: ProjectProfile['userOverrides']) => {
    setProjectProfile(prev => prev ? { ...prev, userOverrides: { ...prev.userOverrides, ...overrides } } : null);
  }, []);

  const refreshProjectHealth = useCallback(async () => {
    if (activeProject.id) {
      agent.logAgentAction('Architect', 'Refreshed workspace system profile and dependencies.', 'info');
    }
  }, [activeProject.id, agent]);

  const startDevServer = useCallback(async (command?: string) => {
    const s = await IDEBuildRunner.startDevServer(projectProfile, command);
    if (s) {
      setDevServerProcess(s);
      ui.setShowPreview(true);
      agent.logAgentAction('Developer', `Started dev server on port ${s.port}`, 'success');
    }
  }, [projectProfile, ui, agent]);

  const stopDevServer = useCallback(async () => {
    await IDEBuildRunner.stopDevServer(devServerProcess);
    setDevServerProcess(null);
    agent.logAgentAction('Developer', 'Development server stopped', 'info');
  }, [devServerProcess, agent]);

  const restartDevServer = useCallback(async () => {
    if (devServerProcess) {
      const cmd = devServerProcess.command;
      await stopDevServer();
      setTimeout(() => {
        startDevServer(cmd);
      }, 500);
    }
  }, [devServerProcess, stopDevServer, startDevServer]);

  const runCommand = useCallback(async (cmd: string) => {
    const lines = await IDEBuildRunner.executeCommand(cmd, runner);
    setTerminalHistory(prev => [...prev, ...lines]);
  }, [runner]);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  const runTests = useCallback(async () => {
    ui.setBottomPanelTab('testExplorer');
    ui.setIsBottomPanelOpen(true);
    agent.logAgentAction('Testing', 'Running test suite...', 'info');

    const res = await IDEBuildRunner.runTests(runner, activeFile);
    setTerminalHistory(prev => [...prev, ...res.lines]);
    setTestResults(res.testResults);

    agent.logAgentAction(
      'Testing',
      `Test suite execution complete: ${res.passed ? 'All assertions passed' : 'Failures detected'} (exit ${res.exitCode})`,
      res.passed ? 'success' : 'error'
    );
  }, [ui, agent, runner, activeFile]);

  const runBuild = useCallback(async () => {
    ui.setBottomPanelTab('terminal');
    ui.setIsBottomPanelOpen(true);
    agent.logAgentAction('Developer', 'Starting build compilation...', 'info');

    const res = await IDEBuildRunner.runBuild(projectProfile, activeFile);
    setTerminalHistory(prev => [...prev, ...res.lines]);

    if (res.diagnostic) {
      setProblems(prev => [...prev, res.diagnostic!]);
    }
    agent.logAgentAction(
      'Developer',
      res.success ? 'Build succeeded with 0 errors' : `Build failed with code ${res.exitCode}`,
      res.success ? 'success' : 'error'
    );
  }, [ui, agent, projectProfile, activeFile]);

  const runLint = useCallback(() => {
    const res = IDEBuildRunner.runLint(runner);
    setTerminalHistory(prev => [...prev, ...res.lines]);
    setProblems(res.diagnostics);
    ui.setBottomPanelTab('problems');
    ui.setIsBottomPanelOpen(true);
    agent.logAgentAction('Reviewer', `Static analysis found ${res.diagnostics.length} problems`, res.exitCode === 0 ? 'success' : 'warning');
  }, [runner, ui, agent]);

  const commitChanges = useCallback((msg: string) => {
    vfs.commit(msg);
    git.commitChanges(msg);
  }, [vfs, git]);

  const revertFile = useCallback((path: string) => {
    git.revertFile(path);
  }, [git]);

  const autonomousEngine = useMemo(() => {
    const engine = new AutonomousAgentEngine(vfs, agent.autonomyMode, projectProfile || undefined);
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
      onLogMessage: (role, message, type) => {
        agent.logAgentAction(role as AgentRole, message, type as AgentLog['type']);
      },
    });
    return engine;
  }, [vfs, agent, projectProfile]);

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
      agent.setOrchestratorStatus('error');
      agent.logAgentAction('Architect', `Planning failed: ${err.message}`, 'error');
    }
  }, [autonomousEngine, git, agent]);

  const pauseAutonomousPlan = useCallback(() => {
    autonomousEngine.pause();
    agent.setOrchestratorStatus('idle');
  }, [autonomousEngine, agent]);

  const resumeAutonomousPlan = useCallback(() => {
    autonomousEngine.resume();
  }, [autonomousEngine]);

  const cancelAutonomousPlan = useCallback(() => {
    autonomousEngine.cancel();
    agent.setOrchestratorStatus('idle');
    agent.logAgentAction('Architect', 'Autonomous orchestration halted', 'warning');
  }, [autonomousEngine, agent]);

  const approveAutonomousPlan = useCallback(() => {
    autonomousEngine.approvePlan();
  }, [autonomousEngine]);

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

  const debuggerEngine = useMemo(() => {
    const engine = new DebuggerEngine(vfs);
    engine.setEvents({
      onSessionStateChange: session => {
        setDebugSession(session ? { ...session } : null);
        if (session && session.status !== 'stopped') {
          ui.setActiveSidebarTab('debugger');
          ui.setBottomPanelTab('debugConsole');
          ui.setIsBottomPanelOpen(true);
        }
      },
      onThreadStateChange: thread => setDebugThread({ ...thread }),
      onBreakpointsChange: bps => setDebugBreakpoints([...bps]),
      onStackFramesChange: frames => setDebugStackFrames([...frames]),
      onVariablesChange: vars => setDebugVariables([...vars]),
      onWatchExpressionsChange: watches => setDebugWatchExpressions([...watches]),
      onConsoleOutput: msg => setDebugConsoleMessages(prev => [...prev, msg]),
      onActiveLocationChange: loc => {
        setDebugLocation(loc);
        if (loc) {
          openFile(loc.filePath);
        }
      },
    });
    setDebugBreakpoints(engine.getBreakpoints());
    setDebugWatchExpressions(engine.getWatchExpressions());
    return engine;
  }, [vfs, ui, openFile]);

  const diagnoseCrashWithAI = useCallback(async () => {
    try {
      const diag = await debuggerEngine.diagnoseWithAI();
      setAiDebugDiagnosis(diag);
      agent.logAgentAction('Debugger', `AI Diagnosis completed: ${diag.hypothesis}`, 'info', diag.suggestedFix);
    } catch (err: any) {
      agent.logAgentAction('Debugger', `AI Diagnosis failed: ${err.message}`, 'error');
    }
  }, [debuggerEngine, agent]);

  const applyAIDebugFix = useCallback(async () => {
    if (!aiDebugDiagnosis || !aiDebugDiagnosis.replacementCode) return;
    const { targetFile, replacementCode } = aiDebugDiagnosis;
    vfs.writeFile(targetFile, replacementCode);
    try {
      await DesktopBridge.writeFile(targetFile, replacementCode);
    } catch {}
    updateFileContent(replacementCode);
    agent.logAgentAction('Debugger', `Applied AI patch to ${targetFile}. Restarting debug session...`, 'success');
    setAiDebugDiagnosis(null);
    debuggerEngine.restartSession();
  }, [aiDebugDiagnosis, vfs, debuggerEngine, updateFileContent, agent]);

  const toggleBreakpoint = useCallback((filePath: string, line: number) => {
    debuggerEngine.toggleBreakpoint(filePath, line);
  }, [debuggerEngine]);

  const executeStep = useCallback(async () => {}, []);
  const approveTask = useCallback((_taskId: string) => {}, []);
  const rejectTask = useCallback((_taskId: string) => {}, []);
  const cancelOrchestration = useCallback(() => {
    agent.setOrchestratorStatus('idle');
  }, [agent]);

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
    await runTests();
    agent.setOrchestratorStatus('idle');
  }, [agent, ui, testResults, problems, openTabs, vfs, activeFile, runTests]);

  const runSecurityReview = useCallback(async () => {
    agent.setActiveAgent('Reviewer');
    ui.setBottomPanelTab('security');
    ui.setIsBottomPanelOpen(true);
    await IDEBuildRunner.runSecurityReview(agent.logAgentAction);
  }, [agent, ui]);

  const createNewProject = useCallback(async (name: string, description: string, archetype: any = 'fullstack-saas') => {
    const newProj = WorkspaceLifecycleService.createNewProject(name, description, archetype);
    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
    agent.logAgentAction('Architect', `Project "${name}" initialized successfully.`, 'success');
  }, [agent]);

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
  }, [vfs, activeFile, ui]);

  const toggleTheme = useCallback(() => {
    const cycleThemeIds = [
      'antigravity',
      'nordic-frost',
      'synthwave-84',
      'dracula',
      'github-dark',
      'tokyo-night',
      'solarized-dark',
      'monokai-pro',
      'cyberpunk',
      'gruvbox-dark',
      'rose-pine',
    ];
    const currentIndex = cycleThemeIds.indexOf(themeEngine.activeTheme.id);
    const nextThemeId = cycleThemeIds[(currentIndex + 1) % cycleThemeIds.length];
    themeEngine.setTheme(nextThemeId);
  }, [themeEngine]);

  const modifiedFiles = useMemo(() => vfs.getModifiedFiles(), [vfs, activeFileContent]);
  const commits = useMemo(() => vfs.getCommits(), [vfs]);
  const fileTree = useMemo(() => vfs.getTree(), [vfs]);

  const value = useMemo<IDEContextType>(() => ({
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

    projectProfile,
    updateProjectProfileOverrides,
    refreshProjectHealth,
    openLocalFolder,
    openLocalFile,
    closeProject,
    confirmCloseProject,
    isCloseModalOpen: ui.isCloseModalOpen,
    setIsCloseModalOpen: ui.setIsCloseModalOpen,
    cloneRepository,
    isCloneModalOpen: git.isCloneModalOpen,
    setIsCloneModalOpen: git.setIsCloneModalOpen,
    isOpenFolderModalOpen: ui.isOpenFolderModalOpen,
    setIsOpenFolderModalOpen: ui.setIsOpenFolderModalOpen,
    devServerProcess,
    startDevServer,
    stopDevServer,
    restartDevServer,
    gitProfile: git.gitProfile,
    refreshGit: async () => { await git.refreshGit(); },
    gitStageFile: git.stageFile,

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

    autonomyMode: agent.autonomyMode,
    setAutonomyMode: agent.setAutonomyMode,
    activeAgent: agent.activeAgent,
    setActiveAgent: agent.setActiveAgent,
    orchestratorStatus: agent.orchestratorStatus,
    taskPlan: agent.taskPlan,
    currentTaskIndex: agent.currentTaskIndex,
    agentLogs: agent.agentLogs,
    logAgentAction: agent.logAgentAction,
    startAutonomousPlan,
    executeStep,
    approveTask,
    rejectTask,
    cancelOrchestration,
    triggerSelfHealDebug,
    runSecurityReview,
    codeReviewResult,

    activeView: ui.activeView,
    setActiveView: ui.setActiveView,
    theme: themeEngine.isDark ? 'dark' : 'light',
    toggleTheme,
    activeSidebarTab: ui.activeSidebarTab,
    setActiveSidebarTab: ui.setActiveSidebarTab,
    bottomPanelTab: ui.bottomPanelTab,
    setBottomPanelTab: ui.setBottomPanelTab,
    isBottomPanelOpen: ui.isBottomPanelOpen,
    toggleBottomPanel: ui.toggleBottomPanel,
    showPreview: ui.showPreview,
    setShowPreview: ui.setShowPreview,
    previewDevice: ui.previewDevice,
    setPreviewDevice: ui.setPreviewDevice,
    hasApiKey,
    cursorPosition: ui.cursorPosition,
    setCursorPosition: ui.setCursorPosition,

    cursorMode: ui.cursorMode,
    setCursorMode: ui.setCursorMode,
    indexer,
    navigator,
    proposedChanges,
    isMultiFileReviewOpen: ui.isMultiFileReviewOpen,
    setIsMultiFileReviewOpen: ui.setIsMultiFileReviewOpen,
    proposeMultiFileChanges,
    applySelectedChanges,
    isAcceptanceModalOpen: ui.isAcceptanceModalOpen,
    setIsAcceptanceModalOpen: ui.setIsAcceptanceModalOpen,
    isControlPanelOpen: ui.isControlPanelOpen,
    setIsControlPanelOpen: ui.setIsControlPanelOpen,
    isProjectWizardOpen: ui.isProjectWizardOpen,
    setIsProjectWizardOpen: ui.setIsProjectWizardOpen,
    isProjectIntelligenceOpen: ui.isProjectIntelligenceOpen,
    setIsProjectIntelligenceOpen: ui.setIsProjectIntelligenceOpen,
    lastInspectionResult,
    inspectFeature,

    isVoiceModalOpen: ui.isVoiceModalOpen,
    setIsVoiceModalOpen: ui.setIsVoiceModalOpen,
    voiceCodingEngine,
    codeEvolutionService,
    bugDetective,
    productionWatchdogService,

    autonomousEngine,
    autonomousPlan: agent.autonomousPlan,
    autonomousExecutionState: agent.autonomousExecutionState,
    verificationSummary: agent.verificationSummary,
    pauseAutonomousPlan,
    resumeAutonomousPlan,
    cancelAutonomousPlan,
    approveAutonomousPlan,
    rejectAutonomousPlan,
    rollbackAutonomousPlan,
    retryAutonomousTask,

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
  }), [
    projects, activeProject, vfs, switchProject, createNewProject, fileTree,
    activeFile, activeFileContent, openTabs, activeTabId, openFile, openFileInEditor,
    closeTab, updateFileContent, saveCurrentFile, saveAllFiles, autoSave, autoSaveDelay,
    isAutoSaving, createFileOrFolder, deleteFileOrFolder, renameFileOrFolder,
    isCreatingFile, isCreatingFolder, startCreatingFile, startCreatingFolder,
    projectProfile, updateProjectProfileOverrides, refreshProjectHealth, openLocalFolder,
    openLocalFile, closeProject, confirmCloseProject, ui, cloneRepository, git,
    devServerProcess, startDevServer, stopDevServer, restartDevServer, terminalHistory,
    runCommand, clearTerminal, testResults, problems, runTests, runBuild, runLint,
    modifiedFiles, commits, commitChanges, revertFile, agent, startAutonomousPlan,
    executeStep, approveTask, rejectTask, cancelOrchestration, triggerSelfHealDebug,
    runSecurityReview, codeReviewResult, themeEngine, toggleTheme, hasApiKey, indexer,
    navigator, proposedChanges, proposeMultiFileChanges, applySelectedChanges,
    lastInspectionResult, inspectFeature, autonomousEngine, pauseAutonomousPlan,
    resumeAutonomousPlan, cancelAutonomousPlan, approveAutonomousPlan, rejectAutonomousPlan,
    rollbackAutonomousPlan, retryAutonomousTask, debuggerEngine, debugSession, debugThread,
    debugBreakpoints, debugStackFrames, debugVariables, debugWatchExpressions,
    debugConsoleMessages, debugLocation, aiDebugDiagnosis, diagnoseCrashWithAI,
    applyAIDebugFix, toggleBreakpoint
  ]);

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
};

export const IDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AgentProvider>
        <GitProvider>
          <IDEInternalProvider>{children}</IDEInternalProvider>
        </GitProvider>
      </AgentProvider>
    </UIProvider>
  );
};

export const useIDE = (): IDEContextType => {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useIDE must be used within an IDEProvider');
  }
  return context;
};
