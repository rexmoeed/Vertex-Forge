import { LanguageInfo, CanonicalProjectProfile } from './profiles';

export interface CodeSymbol {
  id: string;
  name: string;
  kind:
    | 'function'
    | 'class'
    | 'interface'
    | 'type'
    | 'component'
    | 'hook'
    | 'method'
    | 'variable'
    | 'constant'
    | 'enum'
    | 'route'
    | 'module'
    | 'unknown';
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  exported: boolean;
  parentSymbolId?: string;
}

export interface CodeFile {
  path: string;
  relativePath: string;
  language: string;
  size: number;
  lineCount: number;
  imports: string[];
  exports: string[];
  symbols: string[];
  isEntryPoint: boolean;
  isTest: boolean;
  isConfig: boolean;
  isGenerated: boolean;
  lastModified: number;
}

export interface ImportEdge {
  from: string;
  to: string;
  symbols?: string[];
  type: 'static' | 'dynamic' | 'require' | 'type' | 'unknown';
}

export interface ReferenceEdge {
  symbolId: string;
  filePath: string;
  line: number;
  column: number;
  kind: 'call' | 'import' | 'extends' | 'implements' | 'usage' | 'route' | 'unknown';
}

export interface RouteInfo {
  path: string;
  method?: string;
  filePath: string;
  line: number;
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  line: number;
}

export interface CodebaseMap {
  files: Map<string, CodeFile>;
  symbols: Map<string, CodeSymbol>;
  imports: ImportEdge[];
  references: ReferenceEdge[];
  routes: RouteInfo[];
  components: ComponentInfo[];
  generatedAt: number;
  version: number;
}

export interface CodeSearchRequest {
  query: string;
  mode: 'text' | 'regex' | 'semantic' | 'symbol' | 'path' | 'auto';
  rootPath: string;
  include?: string[];
  exclude?: string[];
  maxResults?: number;
}

export interface FileSearchRequest {
  query: string;
  rootPath: string;
  maxResults?: number;
}

export interface FileSearchResult {
  path: string;
  name: string;
}

export interface SymbolSearchRequest {
  query: string;
  kind?: string;
  filePath?: string;
}

export interface CodeSearchResult {
  matches: Array<{ filePath: string; line: number; column: number; text: string; snippet?: string }>;
  query: string;
  mode: string;
  durationMs: number;
}

export interface CodeSearchService {
  search(request: CodeSearchRequest): Promise<CodeSearchResult>;
  findFiles(request: FileSearchRequest): Promise<FileSearchResult[]>;
  findSymbols(request: SymbolSearchRequest): Promise<CodeSymbol[]>;
  findReferences(symbolId: string): Promise<ReferenceEdge[]>;
  findImports(filePath: string): Promise<ImportEdge[]>;
  findDependents(filePath: string): Promise<string[]>;
}

export interface IndexOptions {
  include?: string[];
  exclude?: string[];
  maxDepth?: number;
}

export interface IndexResult {
  fileCount: number;
  symbolCount: number;
  durationMs: number;
}

export interface IndexStatus {
  state: 'idle' | 'indexing' | 'updating' | 'error';
  filesIndexed: number;
  symbolsIndexed: number;
  progress: number;
  error?: string;
  updatedAt: number;
}

export interface ProjectIndexer {
  index(rootPath: string, options?: IndexOptions): Promise<IndexResult>;
  updateFile(filePath: string): Promise<void>;
  removeFile(filePath: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  getMap(rootPath: string): Promise<CodebaseMap>;
  getStatus(rootPath: string): Promise<IndexStatus>;
}

// ==========================================
// 3. FILESYSTEM & WORKSPACE
// ==========================================

export interface ReadFileRequest {
  path: string;
  workspaceId?: string;
  encoding?: string;
}

export interface FileReadResult {
  content: string;
  path: string;
  size: number;
  lastModified: number;
}

export interface WriteFileRequest {
  path: string;
  content: string;
  workspaceId?: string;
  createDirectories?: boolean;
}

export interface FileWriteResult {
  success: boolean;
  path: string;
  bytesWritten: number;
}

export interface CreateFileRequest {
  path: string;
  initialContent?: string;
  workspaceId?: string;
}

export interface CreateDirectoryRequest {
  path: string;
  workspaceId?: string;
}

export interface DeleteRequest {
  path: string;
  workspaceId?: string;
  recursive?: boolean;
}

export interface RenameRequest {
  oldPath: string;
  newPath: string;
  workspaceId?: string;
}

export interface CopyRequest {
  sourcePath: string;
  destinationPath: string;
  workspaceId?: string;
}

export interface MoveRequest {
  sourcePath: string;
  destinationPath: string;
  workspaceId?: string;
}

export interface ListDirectoryRequest {
  path: string;
  workspaceId?: string;
  recursive?: boolean;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface DirectoryListing {
  path: string;
  entries: DirectoryEntry[];
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
}

export interface FileSystemService {
  readFile(request: ReadFileRequest): Promise<FileReadResult>;
  writeFile(request: WriteFileRequest): Promise<FileWriteResult>;
  createFile(request: CreateFileRequest): Promise<FileOperationResult>;
  createDirectory(request: CreateDirectoryRequest): Promise<FileOperationResult>;
  delete(request: DeleteRequest): Promise<FileOperationResult>;
  rename(request: RenameRequest): Promise<FileOperationResult>;
  copy(request: CopyRequest): Promise<FileOperationResult>;
  move(request: MoveRequest): Promise<FileOperationResult>;
  listDirectory(request: ListDirectoryRequest): Promise<DirectoryListing>;
  exists(path: string): Promise<boolean>;
}

export interface Workspace {
  id: string;
  rootPath: string;
  name: string;
  projectProfile?: CanonicalProjectProfile;
  createdAt: number;
  lastOpenedAt: number;
}

export interface OpenWorkspaceRequest {
  rootPath: string;
  name?: string;
}

export interface WorkspaceService {
  open(request: OpenWorkspaceRequest): Promise<Workspace>;
  close(workspaceId: string): Promise<void>;
  getActive(): Promise<Workspace | null>;
  get(workspaceId: string): Promise<Workspace | null>;
  list(): Promise<Workspace[]>;
  refresh(workspaceId: string): Promise<void>;
}

// ==========================================
// 4. AI PROVIDERS & MODELS
// ==========================================
