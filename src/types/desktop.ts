/**
 * Desktop IDE typed contracts for Electron Main <-> Preload <-> Renderer
 */

export interface WorkspaceFile {
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: number;
  children?: WorkspaceFile[];
  language?: string;
  isModified?: boolean;
}

export interface WorkspaceDiff {
  filePath: string;
  original: string;
  modified: string;
  additions: number;
  deletions: number;
  isNew?: boolean;
  isDeleted?: boolean;
  isRenamed?: boolean;
  oldPath?: string;
}

export interface ProposedFileChange {
  id: string;
  filePath: string;
  oldPath?: string;
  action: 'create' | 'modify' | 'rename' | 'delete';
  originalContent?: string;
  newContent: string;
  explanation: string;
  additions: number;
  deletions: number;
  accepted: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SymbolIndexItem {
  name: string;
  kind: 'component' | 'function' | 'interface' | 'type' | 'class' | 'route' | 'constant';
  filePath: string;
  line: number;
  column: number;
  description?: string;
  exported: boolean;
}

export interface ImportRelation {
  sourceFile: string;
  importedFile: string;
  specifiers: string[];
}

export interface CodebaseIndex {
  symbols: SymbolIndexItem[];
  imports: ImportRelation[];
  routes: Array<{ path: string; method?: string; file: string; line: number }>;
  lastUpdated: number;
}

export interface InspectionStep {
  id: string;
  targetFile: string;
  reason: string;
  symbolsFound: string[];
  snippet?: string;
  timestamp: string;
}

export interface InspectionResult {
  query: string;
  explanation: string;
  inspectedFiles: InspectionStep[];
  primaryFile?: string;
  primaryLine?: number;
  relatedFiles: string[];
  architectureSummary?: string;
  steps?: Array<{ action?: string; file?: string; detail?: string; line?: number }>;
  filesInspected?: string[];
}

export interface CommandExecutionOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  allowDestructive?: boolean;
}

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface SecurityPolicy {
  workspaceRoot: string;
  allowedCommands: string[];
  blockedPatterns: string[];
  protectSensitiveFiles: boolean;
  requireApprovalForDestructive: boolean;
}

/**
 * Narrowly scoped, typed IPC interface exposed via contextBridge
 */
export interface IDesktopAPI {
  // Workspace and Files
  openDirectoryDialog: () => Promise<string | null>;
  openFileDialog?: () => Promise<string | null>;
  setWorkspacePath?: (newPath: string) => Promise<{ success: boolean; path?: string }> | void;
  getWorkspaceTree: (workspacePath: string) => Promise<WorkspaceFile[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  createFile: (filePath: string, initialContent?: string) => Promise<{ success: boolean; error?: string }>;
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  deletePath: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  renamePath: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Search & Navigation
  searchWorkspace: (query: string, options?: { caseSensitive?: boolean; wholeWord?: boolean }) => Promise<Array<{ filePath: string; line: number; text: string }>>;
  
  // Terminal and Execution (PTY / Controlled Child Process)
  executeCommand: (command: string, options?: CommandExecutionOptions) => Promise<CommandExecutionResult>;
  
  // Git operations
  getGitStatus: (workspacePath: string) => Promise<{
    branch: string;
    modified: string[];
    staged: string[];
    untracked: string[];
    isRepo?: boolean;
    ahead?: number;
    behind?: number;
    lastCommit?: any;
    modifiedCount?: number;
    stagedCount?: number;
    untrackedCount?: number;
  }>;
  getGitDiff: (workspacePath: string, filePath?: string) => Promise<string>;
  gitCommit: (workspacePath: string, message: string) => Promise<{ hash: string; success: boolean }>;
  
  // Security & Environment
  isElectron: boolean;
  platform: 'darwin' | 'win32' | 'linux';
  checkPathAllowed: (filePath: string) => Promise<boolean>;

  // Auto-Update capabilities
  checkForUpdates?: () => Promise<{ status: string; message?: string; updateInfo?: any }>;
  restartAndInstallUpdate?: () => Promise<boolean>;
}

declare global {
  interface Window {
    desktopAPI?: IDesktopAPI;
  }
}
