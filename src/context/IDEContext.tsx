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
import { AICodeReviewResponse } from '../services/geminiService';
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
import { UIProvider, useUI, CursorMode, IDEActiveView, UIContextType } from './UIContext';
import { GitProvider, useGit } from './GitContext';
import { AgentProvider, useAgent } from './AgentContext';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { TerminalProvider, useTerminal } from './TerminalContext';
import { WorkspaceLifecycleService } from '../services/workspaceLifecycleService';
import { useIDEDebugger } from './hooks/useIDEDebugger';
import { useIDEAutonomousEngine } from './hooks/useIDEAutonomousEngine';

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
  activeSidebarTab: UIContextType['activeSidebarTab'];
  setActiveSidebarTab: (tab: any) => void;
  bottomPanelTab: UIContextType['bottomPanelTab'];
  setBottomPanelTab: (tab: any) => void;
  isBottomPanelOpen: boolean;
  toggleBottomPanel: () => void;
  showPreview: boolean;
  setShowPreview: (val: boolean) => void;
  previewDevice: UIContextType['previewDevice'];
  setPreviewDevice: (device: any) => void;
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
  approveAutonomousPlan: () => Promise<void>;
  rejectAutonomousPlan: () => void;
  rollbackAutonomousPlan: (checkpointId?: string) => Promise<boolean>;
  retryAutonomousTask: (taskId: string) => Promise<void>;

  debuggerEngine: DebuggerEngine;
  debugSession: DebugSession | null;
  debugThread: Thread | null;
  debugBreakpoints: Breakpoint[];
  debugStackFrames: StackFrame[];
  debugVariables: Variable[];
  debugWatchExpressions: WatchExpression[];
  debugConsoleMessages: DebugConsoleMessage[];
  debugLocation: { filePath: string; line: number } | null;
  aiDebugDiagnosis: AIDebugDiagnosis | null;
  diagnoseCrashWithAI: () => Promise<void>;
  applyAIDebugFix: () => Promise<void>;
  toggleBreakpoint: (filePath: string, line: number) => void;
}

const IDEContext = createContext<IDEContextType | undefined>(undefined);

const IDEInternalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ui = useUI();
  const git = useGit();
  const agent = useAgent();
  const terminal = useTerminal();
  const workspace = useWorkspace();
  const themeEngine = useTheme();

    const [vfs, setVfs] = useState<VirtualFileSystem>(() => new VirtualFileSystem([]));

  const { setRunner } = terminal;
  useEffect(() => {
    if (!workspace.activeProject.rootFiles || workspace.activeProject.rootFiles.length === 0) return;
    const newVfs = new VirtualFileSystem(workspace.activeProject.rootFiles);
    setVfs(newVfs);
    setRunner(new TerminalRunner(newVfs));
  }, [workspace.activeProject.id, workspace.activeProject.rootFiles, setRunner]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(1000);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const startCreatingFile = useCallback(() => setIsCreatingFile(true), []);
  const startCreatingFolder = useCallback(() => setIsCreatingFolder(true), []);

  const openFileInEditor = useCallback(async (request: OpenFileRequest | string, diffMode: boolean = false): Promise<OpenTab> => {
    const req: OpenFileRequest = typeof request === 'string'
      ? { workspaceId: workspace.activeProject.id, path: request, source: 'explorer', diffMode }
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
  }, [openTabs, vfs, workspace.activeProject.id, ui, agent]);

  const openFile = useCallback(async (pathOrReq: string | OpenFileRequest, diffMode: boolean = false) => {
    return openFileInEditor(pathOrReq, diffMode);
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
      setOpenTabs(prev => prev.map(t => t.filePath === activeFile ? { ...t, content: newContent, isDirty: true } : t));
    }
  }, [activeFile, vfs]);

  const saveCurrentFile = useCallback(async () => {
    if (!activeFile) return;
    setIsAutoSaving(true);
    vfs.writeFile(activeFile, activeFileContent);
    await DesktopBridge.writeFile(activeFile, activeFileContent);
    setOpenTabs(prev => prev.map(t => t.filePath === activeFile ? { ...t, isDirty: false } : t));
    setIsAutoSaving(false);
    git.refreshGit();
  }, [activeFile, activeFileContent, vfs, git]);

  const saveAllFiles = useCallback(async () => {
    for (const tab of openTabs) {
      if (tab.isDirty) {
        const c = vfs.readFile(tab.filePath) ?? '';
        vfs.writeFile(tab.filePath, c);
        await DesktopBridge.writeFile(tab.filePath, c);
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
      workspace.setActiveProject(res.project);
      workspace.setProjectProfile(res.profile);
      workspace.setProjects(prev => [res.project, ...prev.filter(p => p.id !== res.project.id)]);
      setVfs(res.services.vfs);
      terminal.setRunner(res.services.runner);
      autoEngine.setIndexer(res.services.indexer);
      autoEngine.setNavigator(res.services.navigator);
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
  }, [ui, agent, workspace, terminal]);

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
    setActiveTabId(null);
    setActiveFile(null);
    setActiveFileContent('');
    ui.setIsCloseModalOpen(false);
  }, [saveAllFiles, ui]);

  const cloneRepository = useCallback(async (repoUrl: string, targetDir?: string): Promise<boolean> => {
    try {
      agent.logAgentAction('Architect', `Cloning ${repoUrl}...`, 'info');
      await new Promise(r => setTimeout(r, 600));
      agent.logAgentAction('Architect', `Cloned ${repoUrl} successfully.`, 'success');
      git.setIsCloneModalOpen(false);
      return true;
    } catch {
      return false;
    }
  }, [agent, git]);

  const commitChanges = useCallback((msg: string) => {
    vfs.commit(msg);
    git.commitChanges(msg);
  }, [vfs, git]);

  const revertFile = useCallback((path: string) => {
    git.revertFile(path);
  }, [git]);

  const autoEngine = useIDEAutonomousEngine({
    vfs,
    projectProfile: workspace.projectProfile,
    agent,
    ui,
    git,
    activeFile,
    activeFileContent,
    setActiveFileContent,
    openTabs,
    testResults: terminal.testResults,
    problems: terminal.problems,
    runTests: terminal.runTests,
  });

  const dbg = useIDEDebugger({
    vfs,
    ui,
    openFile,
    agent,
    updateFileContent,
  });

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

  const executeStep = useCallback(async () => {}, []);
  const approveTask = useCallback((_taskId: string) => {}, []);
  const rejectTask = useCallback((_taskId: string) => {}, []);
  const cancelOrchestration = useCallback(() => {
    agent.setOrchestratorStatus('idle');
  }, [agent]);

  const value = useMemo<IDEContextType>(() => ({
    projects: workspace.projects,
    activeProject: workspace.activeProject,
    vfs,
    switchProject: pId => workspace.switchProject(pId, agent.logAgentAction),
    createNewProject: async (name, desc, arch) => {
      await workspace.createNewProject(name, desc, arch, agent.logAgentAction);
    },
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

    projectProfile: workspace.projectProfile,
    updateProjectProfileOverrides: workspace.updateProjectProfileOverrides,
    refreshProjectHealth: workspace.refreshProjectHealth,
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
    devServerProcess: workspace.devServerProcess,
    startDevServer: workspace.startDevServer,
    stopDevServer: workspace.stopDevServer,
    restartDevServer: workspace.restartDevServer,
    gitProfile: git.gitProfile,
    refreshGit: async () => { await git.refreshGit(); },
    gitStageFile: git.stageFile,

    terminalHistory: terminal.terminalHistory,
    runCommand: terminal.runCommand,
    clearTerminal: terminal.clearTerminal,
    testResults: terminal.testResults,
    problems: terminal.problems,
    runTests: () => terminal.runTests(activeFile, agent.logAgentAction),
    runBuild: () => terminal.runBuild(workspace.projectProfile, activeFile, agent.logAgentAction),
    runLint: () => terminal.runLint(agent.logAgentAction),

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
    startAutonomousPlan: autoEngine.startAutonomousPlan,
    executeStep,
    approveTask,
    rejectTask,
    cancelOrchestration,
    triggerSelfHealDebug: autoEngine.triggerSelfHealDebug,
    runSecurityReview: autoEngine.runSecurityReview,
    codeReviewResult: autoEngine.codeReviewResult,

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
    hasApiKey: autoEngine.hasApiKey,
    cursorPosition: ui.cursorPosition,
    setCursorPosition: ui.setCursorPosition,

    cursorMode: ui.cursorMode,
    setCursorMode: ui.setCursorMode,
    indexer: autoEngine.indexer,
    navigator: autoEngine.navigator,
    proposedChanges: autoEngine.proposedChanges,
    isMultiFileReviewOpen: ui.isMultiFileReviewOpen,
    setIsMultiFileReviewOpen: ui.setIsMultiFileReviewOpen,
    proposeMultiFileChanges: autoEngine.proposeMultiFileChanges,
    applySelectedChanges: autoEngine.applySelectedChanges,
    isAcceptanceModalOpen: ui.isAcceptanceModalOpen,
    setIsAcceptanceModalOpen: ui.setIsAcceptanceModalOpen,
    isControlPanelOpen: ui.isControlPanelOpen,
    setIsControlPanelOpen: ui.setIsControlPanelOpen,
    isProjectWizardOpen: ui.isProjectWizardOpen,
    setIsProjectWizardOpen: ui.setIsProjectWizardOpen,
    isProjectIntelligenceOpen: ui.isProjectIntelligenceOpen,
    setIsProjectIntelligenceOpen: ui.setIsProjectIntelligenceOpen,
    lastInspectionResult: autoEngine.lastInspectionResult,
    inspectFeature: autoEngine.inspectFeature,

    isVoiceModalOpen: ui.isVoiceModalOpen,
    setIsVoiceModalOpen: ui.setIsVoiceModalOpen,
    voiceCodingEngine,
    codeEvolutionService,
    bugDetective,
    productionWatchdogService,

    autonomousEngine: autoEngine.autonomousEngine,
    autonomousPlan: agent.autonomousPlan,
    autonomousExecutionState: agent.autonomousExecutionState,
    verificationSummary: agent.verificationSummary,
    pauseAutonomousPlan: autoEngine.pauseAutonomousPlan,
    resumeAutonomousPlan: autoEngine.resumeAutonomousPlan,
    cancelAutonomousPlan: autoEngine.cancelAutonomousPlan,
    approveAutonomousPlan: autoEngine.approveAutonomousPlan,
    rejectAutonomousPlan: autoEngine.rejectAutonomousPlan,
    rollbackAutonomousPlan: autoEngine.rollbackAutonomousPlan,
    retryAutonomousTask: autoEngine.retryAutonomousTask,

    debuggerEngine: dbg.debuggerEngine,
    debugSession: dbg.debugSession,
    debugThread: dbg.debugThread,
    debugBreakpoints: dbg.debugBreakpoints,
    debugStackFrames: dbg.debugStackFrames,
    debugVariables: dbg.debugVariables,
    debugWatchExpressions: dbg.debugWatchExpressions,
    debugConsoleMessages: dbg.debugConsoleMessages,
    debugLocation: dbg.debugLocation,
    aiDebugDiagnosis: dbg.aiDebugDiagnosis,
    diagnoseCrashWithAI: dbg.diagnoseCrashWithAI,
    applyAIDebugFix: dbg.applyAIDebugFix,
    toggleBreakpoint: dbg.toggleBreakpoint,
  }), [
    workspace, vfs, openTabs, activeTabId, activeFile, activeFileContent,
    openFile, openFileInEditor, closeTab, updateFileContent, saveCurrentFile,
    saveAllFiles, autoSave, autoSaveDelay, isAutoSaving, createFileOrFolder,
    deleteFileOrFolder, renameFileOrFolder, isCreatingFile, isCreatingFolder,
    openLocalFolder, openLocalFile, closeProject, confirmCloseProject, ui,
    cloneRepository, git, terminal, modifiedFiles, commits, commitChanges,
    revertFile, agent, autoEngine, dbg, themeEngine, toggleTheme, executeStep,
    approveTask, rejectTask, cancelOrchestration
  ]);

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
};

export const IDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <WorkspaceProvider>
        <AgentProvider>
          <GitProvider>
            <TerminalProvider>
              <IDEInternalProvider>{children}</IDEInternalProvider>
            </TerminalProvider>
          </GitProvider>
        </AgentProvider>
      </WorkspaceProvider>
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
