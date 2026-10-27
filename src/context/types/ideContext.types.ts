import React from 'react';
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
} from '../../types/ide';
import { VirtualFileSystem } from '../../services/virtualFs';
import { AICodeReviewResponse } from '../../services/geminiService';
import { ProposedFileChange, InspectionResult } from '../../types/desktop';
import { ProjectProfile, DevServerProcess, GitProfile } from '../../types/project';
import { CodebaseIndexer } from '../../services/codebaseIndexer';
import { AIProjectNavigator } from '../../services/aiNavigator';
import { OpenFileRequest, EditorFileService } from '../../services/editorFileService';
import { VoiceCodingEngine } from '../../services/voiceCodingEngine';
import { ConcreteCodeEvolutionService } from '../../services/codeEvolutionService';
import { ConcreteBugDetective } from '../../services/bugDetectiveService';
import { ProductionWatchdogService } from '../../services/productionWatchdogService';
import { AutonomousAgentEngine } from '../../services/autonomousAgentEngine';
import { AutonomousPlan, AutonomousExecutionState, VerificationSummary } from '../../types/autonomousAgent';
import { DebuggerEngine } from '../../services/debuggerEngine';
import {
  Breakpoint,
  StackFrame,
  Variable,
  WatchExpression,
  Thread,
  DebugSession,
  DebugConsoleMessage,
  AIDebugDiagnosis,
} from '../../types/debugger';
import { CursorMode, IDEActiveView, UIContextType } from '../UIContext';

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
  aiCodeReview: AICodeReviewResponse | null;
  isReviewingCode: boolean;
  reviewCurrentCode: () => Promise<void>;
  executeStep: () => Promise<void>;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  cancelOrchestration: () => void;
  startAutonomousPlan: (userPrompt: string) => void;
  triggerSelfHealDebug: (errorDetails?: string) => Promise<void>;
  runSecurityReview: () => Promise<void>;
  codeReviewResult: AICodeReviewResponse | null;

  activeAgent: AgentRole;
  setActiveAgent: (role: AgentRole) => void;
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  orchestratorStatus: OrchestratorStatus;
  taskPlan: TaskItem[];
  currentTaskIndex: number;
  agentLogs: AgentLog[];
  logAgentAction: (agent: AgentRole, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

  activeView: IDEActiveView;
  setActiveView: (view: IDEActiveView) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeThemeName: string;
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
