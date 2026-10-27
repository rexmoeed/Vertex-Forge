import {
  FileSystemService,
  ReadFileRequest,
  FileReadResult,
  WriteFileRequest,
  FileWriteResult,
  CreateFileRequest,
  CreateDirectoryRequest,
  DeleteRequest,
  RenameRequest,
  CopyRequest,
  MoveRequest,
  ListDirectoryRequest,
  DirectoryListing,
  FileOperationResult,
} from '../../types/projectIntelligence';
import { DesktopBridge } from '../desktopBridge';
import { VirtualFileSystem } from '../virtualFs';

export class ConcreteFileSystemService implements FileSystemService {
  private vfs: VirtualFileSystem | null = null;

  constructor(vfs?: VirtualFileSystem) {
    if (vfs) this.vfs = vfs;
  }

  public setVFS(vfs: VirtualFileSystem) {
    this.vfs = vfs;
  }

  public async readFile(request: ReadFileRequest): Promise<FileReadResult> {
    let content = this.vfs?.readFile(request.path);
    if (content === null || content === undefined) {
      content = await DesktopBridge.readFile(request.path);
      if (this.vfs) this.vfs.writeFile(request.path, content);
    }
    return {
      content: content || '',
      path: request.path,
      size: (content || '').length,
      lastModified: Date.now(),
    };
  }

  public async writeFile(request: WriteFileRequest): Promise<FileWriteResult> {
    if (this.vfs) this.vfs.writeFile(request.path, request.content);
    await DesktopBridge.writeFile(request.path, request.content);
    return {
      success: true,
      path: request.path,
      bytesWritten: request.content.length,
    };
  }

  public async createFile(request: CreateFileRequest): Promise<FileOperationResult> {
    if (this.vfs) this.vfs.writeFile(request.path, request.initialContent || '');
    await DesktopBridge.createFile(request.path, request.initialContent || '');
    return { success: true, path: request.path };
  }

  public async createDirectory(request: CreateDirectoryRequest): Promise<FileOperationResult> {
    if (this.vfs) this.vfs.writeFile(`${request.path}/.keep`, '');
    await DesktopBridge.createDirectory(request.path);
    return { success: true, path: request.path };
  }

  public async delete(request: DeleteRequest): Promise<FileOperationResult> {
    if (this.vfs) this.vfs.deleteNode(request.path);
    await DesktopBridge.deletePath(request.path);
    return { success: true, path: request.path };
  }

  public async rename(request: RenameRequest): Promise<FileOperationResult> {
    if (this.vfs) {
      const c = this.vfs.readFile(request.oldPath) || '';
      this.vfs.writeFile(request.newPath, c);
      this.vfs.deleteNode(request.oldPath);
    }
    await DesktopBridge.renamePath(request.oldPath, request.newPath);
    return { success: true, path: request.newPath };
  }

  public async copy(request: CopyRequest): Promise<FileOperationResult> {
    const src = await this.readFile({ path: request.sourcePath });
    await this.writeFile({ path: request.destinationPath, content: src.content });
    return { success: true, path: request.destinationPath };
  }

  public async move(request: MoveRequest): Promise<FileOperationResult> {
    return this.rename({ oldPath: request.sourcePath, newPath: request.destinationPath });
  }

  public async listDirectory(request: ListDirectoryRequest): Promise<DirectoryListing> {
    const tree = await DesktopBridge.getWorkspaceTree(request.path || DesktopBridge.currentWorkspacePath);
    return {
      path: request.path,
      entries: tree.map(t => ({
        name: t.name,
        path: t.path,
        type: t.type === 'file' ? 'file' : 'directory',
        size: t.size,
      })),
    };
  }

  public async exists(path: string): Promise<boolean> {
    if (this.vfs?.findNode(path)) return true;
    const inspect = await DesktopBridge.inspectPath(path);
    return inspect.exists;
  }
}
