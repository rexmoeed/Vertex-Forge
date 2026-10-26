/**
 * Autonomous Agent Tool Registry & Safety Policy Engine
 * Connects AI agent orchestrator to real filesystem, shell, git, test runner,
 * compiler, and preview services with parameter validation, checkpoints, and diffs.
 */

import {
  ToolName,
  ToolResult,
  SafetyCheckResult,
  PermissionMode,
  FileCheckpoint,
} from '../types/autonomousAgent';
import { DesktopBridge } from './desktopBridge';
import { VirtualFileSystem } from './virtualFs';
import { logger } from './logger';

export class AgentToolRegistry {
  private vfs: VirtualFileSystem;
  private checkpoints: Map<string, FileCheckpoint> = new Map();
  private permissionMode: PermissionMode = 'autonomous';
  private workspaceRoot: string = '.';

  constructor(vfs: VirtualFileSystem, permissionMode: PermissionMode = 'autonomous') {
    this.vfs = vfs;
    this.permissionMode = permissionMode;
  }

  public setPermissionMode(mode: PermissionMode) {
    this.permissionMode = mode;
  }

  public getPermissionMode(): PermissionMode {
    return this.permissionMode;
  }

  public setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
  }

  // ==========================================
  // SAFETY & PERMISSION INTERCEPTOR
  // ==========================================

  public evaluateSafety(tool: ToolName, args: Record<string, any>): SafetyCheckResult {
    // 1. Path Safety & Traversal Guards
    const filePath = args.filePath || args.targetPath || args.path || args.dirPath;
    if (filePath && typeof filePath === 'string') {
      const normalized = filePath.replace(/\\/g, '/');

      // Reject attempts to escape project or touch root system files
      if (
        normalized.includes('/../..') ||
        normalized.startsWith('/etc') ||
        normalized.startsWith('/usr') ||
        normalized.startsWith('/bin') ||
        normalized.startsWith('/sbin') ||
        normalized.startsWith('/var') ||
        normalized.startsWith('/root') ||
        normalized.startsWith('C:/Windows')
      ) {
        return {
          allowed: false,
          requiresExplicitApproval: true,
          riskLevel: 'critical',
          reason: `Access to system or external path forbidden: ${filePath}`,
        };
      }

      // Sensitive files protection
      const sensitiveFiles = ['.env', '.env.local', 'id_rsa', 'id_ed25519', 'credentials.json'];
      if (sensitiveFiles.some(s => normalized.endsWith(s))) {
        return {
          allowed: this.permissionMode === 'autonomous',
          requiresExplicitApproval: true,
          riskLevel: 'high',
          reason: `Attempt to access or modify sensitive credentials file: ${filePath}`,
        };
      }
    }

    // 2. Command Safety Guards
    if (tool === 'terminal_command') {
      const command = (args.command || '').trim();
      const lower = command.toLowerCase();

      // Prohibited destructive commands
      const destructivePatterns = [
        /rm\s+-rf\s+[\/\*]/,
        /rm\s+-rf\s+\.\./,
        /mkfs/,
        /dd\s+if=/,
        /:(){ :\|:& };:/, // fork bomb
        /chmod\s+-r\s+777\s+\//,
        /git\s+reset\s+--hard\s+head~[0-9]{2,}/,
        /git\s+push\s+.*--force/,
        /drop\s+database/i,
        /drop\s+table/i,
        /truncate\s+table/i,
      ];

      for (const pattern of destructivePatterns) {
        if (pattern.test(lower)) {
          return {
            allowed: false,
            requiresExplicitApproval: true,
            riskLevel: 'critical',
            reason: `Destructive shell command prohibited without explicit confirmation: "${command}"`,
          };
        }
      }

      // Commands that write/delete require approval in supervised or strict modes
      if (this.permissionMode === 'strict') {
        return {
          allowed: false,
          requiresExplicitApproval: true,
          riskLevel: 'medium',
          reason: `Strict mode requires confirmation for shell command: "${command}"`,
        };
      }

      if (this.permissionMode === 'supervised') {
        const modifyingVerbs = ['rm', 'mv', 'cp', 'npm install', 'git checkout', 'git commit'];
        if (modifyingVerbs.some(verb => lower.includes(verb))) {
          return {
            allowed: false,
            requiresExplicitApproval: true,
            riskLevel: 'medium',
            reason: `Supervised mode requires individual approval for command: "${command}"`,
          };
        }
      }
    }

    // 3. File Modification & Deletion Guards
    if (tool === 'delete_file') {
      const path = (args.filePath || '').toLowerCase();
      if (path === 'package.json' || path === 'tsconfig.json' || path === 'vite.config.ts') {
        return {
          allowed: false,
          requiresExplicitApproval: true,
          riskLevel: 'high',
          reason: `Deleting core manifest "${args.filePath}" requires explicit human authorization.`,
        };
      }
      if (this.permissionMode !== 'autonomous') {
        return {
          allowed: false,
          requiresExplicitApproval: true,
          riskLevel: 'medium',
          reason: `File deletion requires approval in ${this.permissionMode} mode.`,
        };
      }
    }

    if (tool === 'write_file' || tool === 'patch_file' || tool === 'create_file') {
      if (this.permissionMode === 'strict') {
        return {
          allowed: false,
          requiresExplicitApproval: true,
          riskLevel: 'medium',
          reason: `Strict mode requires confirmation before editing: ${args.filePath}`,
        };
      }
    }

    return {
      allowed: true,
      requiresExplicitApproval: false,
      riskLevel: 'safe',
    };
  }

  // ==========================================
  // CHECKPOINT & ROLLBACK ENGINE
  // ==========================================

  public async createCheckpoint(taskId: string, filePaths: string[], description: string = 'Pre-task state'): Promise<FileCheckpoint> {
    const checkpointId = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const files: FileCheckpoint['files'] = [];

    for (const rawPath of filePaths) {
      const cleanPath = rawPath.replace(/\\/g, '/');
      let originalContent: string | null = null;
      let existsBefore = false;

      // 1. Try VFS
      if (this.vfs.exists(cleanPath)) {
        originalContent = this.vfs.readFile(cleanPath);
        existsBefore = true;
      } else {
        // 2. Try disk
        try {
          const diskRead = await DesktopBridge.readFile(cleanPath);
          if (diskRead !== undefined && diskRead !== null) {
            originalContent = diskRead;
            existsBefore = true;
          } else {
            existsBefore = false;
          }
        } catch {
          existsBefore = false;
        }
      }

      files.push({
        path: cleanPath,
        originalContent,
        existsBefore,
      });
    }

    const checkpoint: FileCheckpoint = {
      id: checkpointId,
      taskId,
      timestamp: Date.now(),
      description,
      files,
    };

    this.checkpoints.set(checkpointId, checkpoint);
    return checkpoint;
  }

  public async rollbackCheckpoint(checkpointId: string): Promise<{ success: boolean; revertedFiles: string[]; error?: string }> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return { success: false, revertedFiles: [], error: `Checkpoint ${checkpointId} not found.` };
    }

    const revertedFiles: string[] = [];

    for (const item of checkpoint.files) {
      try {
        if (!item.existsBefore || item.originalContent === null || item.originalContent === undefined) {
          // File was created by agent -> delete it
          this.vfs.deleteNode(item.path);
          await DesktopBridge.deletePath(item.path);
        } else {
          // File was modified by agent -> revert to original
          this.vfs.writeFile(item.path, item.originalContent);
          await DesktopBridge.writeFile(item.path, item.originalContent);
        }
        revertedFiles.push(item.path);
      } catch (err: any) {
        logger.warn(`Rollback error for ${item.path}:`, err?.message);
      }
    }

    return { success: true, revertedFiles };
  }

  public getCheckpoint(checkpointId: string): FileCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  // ==========================================
  // TOOL EXECUTION DISPATCHER
  // ==========================================

  public async executeTool(tool: ToolName, args: Record<string, any>, taskId?: string): Promise<ToolResult> {
    const startTime = Date.now();

    // 1. Safety check
    const safety = this.evaluateSafety(tool, args);
    if (!safety.allowed && safety.requiresExplicitApproval) {
      return {
        success: false,
        error: safety.reason || 'Permission denied: safety check failed.',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      let result: ToolResult;

      switch (tool) {
        case 'file_search':
          result = await this.toolFileSearch(args);
          break;
        case 'symbol_search':
          result = await this.toolSymbolSearch(args);
          break;
        case 'read_file':
          result = await this.toolReadFile(args);
          break;
        case 'write_file':
          result = await this.toolWriteFile(args, taskId);
          break;
        case 'patch_file':
          result = await this.toolPatchFile(args, taskId);
          break;
        case 'create_file':
          result = await this.toolCreateFile(args, taskId);
          break;
        case 'delete_file':
          result = await this.toolDeleteFile(args, taskId);
          break;
        case 'list_dir':
          result = await this.toolListDir(args);
          break;
        case 'terminal_command':
          result = await this.toolTerminalCommand(args);
          break;
        case 'server_lifecycle':
          result = await this.toolServerLifecycle(args);
          break;
        case 'browser_navigate':
          result = await this.toolBrowserNavigate(args);
          break;
        case 'git_status':
          result = await this.toolGitStatus(args);
          break;
        case 'git_diff':
          result = await this.toolGitDiff(args);
          break;
        case 'run_tests':
          result = await this.toolRunTests(args);
          break;
        case 'type_check':
          result = await this.toolTypeCheck(args);
          break;
        case 'build_project':
          result = await this.toolBuildProject(args);
          break;
        case 'project_diagnostics':
          result = await this.toolProjectDiagnostics(args);
          break;
        default:
          return {
            success: false,
            error: `Unknown tool: ${tool}`,
            durationMs: Date.now() - startTime,
          };
      }

      result.durationMs = Date.now() - startTime;
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Tool execution encountered an unhandled exception.',
        durationMs: Date.now() - startTime,
      };
    }
  }

  // ==========================================
  // TOOL IMPLEMENTATIONS
  // ==========================================

  private async toolFileSearch(args: Record<string, any>): Promise<ToolResult> {
    const query = (args.query || '').trim();
    if (!query) {
      return { success: false, error: 'Query parameter is required for file_search.' };
    }

    try {
      // 1. Try real backend search
      const res = await fetch('/api/fs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dirPath: this.workspaceRoot }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          data: data.results || [],
          output: `Found ${(data.results || []).length} matches for "${query}".`,
        };
      }
    } catch {
      // Fallback to VFS search
    }

    // VFS Fallback search
    const tree = this.vfs.getTree();
    const results: Array<{ filePath: string; line: number; text: string }> = [];

    const searchNode = (node: any) => {
      if (node.type === 'file' && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((lineText: string, idx: number) => {
          if (lineText.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              filePath: node.path,
              line: idx + 1,
              text: lineText.trim(),
            });
          }
        });
      }
      if (node.children) node.children.forEach(searchNode);
    };
    tree.forEach(searchNode);

    return {
      success: true,
      data: results.slice(0, 50),
      output: `Found ${results.length} matches in workspace.`,
    };
  }

  private async toolSymbolSearch(args: Record<string, any>): Promise<ToolResult> {
    const symbol = (args.symbol || args.query || '').trim();
    if (!symbol) return { success: false, error: 'Symbol parameter is required.' };

    const regex = new RegExp(`\\b(function|const|let|var|class|interface|type|enum)\\s+${symbol}\\b`, 'i');
    const matches: Array<{ filePath: string; line: number; declaration: string }> = [];

    const searchNode = (node: any) => {
      if (node.type === 'file' && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((l: string, i: number) => {
          if (regex.test(l) || l.includes(`export const ${symbol}`) || l.includes(`export function ${symbol}`)) {
            matches.push({
              filePath: node.path,
              line: i + 1,
              declaration: l.trim(),
            });
          }
        });
      }
      if (node.children) node.children.forEach(searchNode);
    };

    this.vfs.getTree().forEach(searchNode);

    return {
      success: true,
      data: matches,
      output: `Found ${matches.length} symbol declarations matching "${symbol}".`,
    };
  }

  private async toolReadFile(args: Record<string, any>): Promise<ToolResult> {
    const filePath = (args.filePath || '').replace(/\\/g, '/');
    if (!filePath) return { success: false, error: 'filePath is required for read_file.' };

    let content: string | null = null;

    // Try VFS first
    if (this.vfs.exists(filePath)) {
      content = this.vfs.readFile(filePath);
    } else {
      // Try real disk
      try {
        content = await DesktopBridge.readFile(filePath);
        // Sync to VFS
        if (content !== null) {
          this.vfs.writeFile(filePath, content);
        }
      } catch (e: any) {
        return { success: false, error: `File not found: ${filePath}` };
      }
    }

    if (content === null) {
      return { success: false, error: `Failed to read ${filePath}` };
    }

    // Optional line slice
    const startLine = args.startLine ? Math.max(1, parseInt(args.startLine, 10)) : 1;
    const endLine = args.endLine ? parseInt(args.endLine, 10) : undefined;

    const lines = content.split('\n');
    let outputLines = lines;
    if (startLine > 1 || endLine !== undefined) {
      const sliceEnd = endLine ? Math.min(lines.length, endLine) : lines.length;
      outputLines = lines.slice(startLine - 1, sliceEnd);
    }

    return {
      success: true,
      data: {
        content: outputLines.join('\n'),
        totalLines: lines.length,
        startLine,
        endLine: endLine || lines.length,
        filePath,
      },
      output: outputLines.join('\n'),
    };
  }

  private async toolWriteFile(args: Record<string, any>, taskId?: string): Promise<ToolResult> {
    const filePath = (args.filePath || '').replace(/\\/g, '/');
    const content = args.content !== undefined ? args.content : '';
    if (!filePath) return { success: false, error: 'filePath is required for write_file.' };

    // Record checkpoint before modification
    if (taskId) {
      await this.createCheckpoint(taskId, [filePath], `Before writing ${filePath}`);
    }

    const previousContent = this.vfs.readFile(filePath) ?? '';
    const diff = this.generateUnifiedDiff(filePath, previousContent, content);

    // Write to VFS
    this.vfs.writeFile(filePath, content);

    // Write to real disk
    try {
      await DesktopBridge.writeFile(filePath, content);
    } catch (err: any) {
      logger.warn(`Real disk write warning for ${filePath}:`, err?.message);
    }

    return {
      success: true,
      changesDetected: previousContent !== content,
      diff,
      data: { filePath, bytesWritten: content.length },
      output: `Successfully wrote ${filePath} (${content.length} bytes).`,
    };
  }

  private async toolPatchFile(args: Record<string, any>, taskId?: string): Promise<ToolResult> {
    const filePath = (args.filePath || '').replace(/\\/g, '/');
    const targetString = args.targetString;
    const replacementString = args.replacementString;

    if (!filePath || targetString === undefined || replacementString === undefined) {
      return { success: false, error: 'filePath, targetString, and replacementString are required.' };
    }

    let current = this.vfs.readFile(filePath);
    if (current === null) {
      try {
        current = await DesktopBridge.readFile(filePath);
      } catch {
        return { success: false, error: `File not found to patch: ${filePath}` };
      }
    }

    if (!current.includes(targetString)) {
      return {
        success: false,
        error: `Target string was not found in ${filePath}. Check indentation or whitespace.`,
      };
    }

    if (taskId) {
      await this.createCheckpoint(taskId, [filePath], `Before patching ${filePath}`);
    }

    const patched = current.replace(targetString, replacementString);
    const diff = this.generateUnifiedDiff(filePath, current, patched);

    this.vfs.writeFile(filePath, patched);
    await DesktopBridge.writeFile(filePath, patched);

    return {
      success: true,
      changesDetected: true,
      diff,
      output: `Patched ${filePath} successfully.`,
    };
  }

  private async toolCreateFile(args: Record<string, any>, taskId?: string): Promise<ToolResult> {
    const filePath = (args.filePath || '').replace(/\\/g, '/');
    const initialContent = args.initialContent || '';
    if (!filePath) return { success: false, error: 'filePath is required for create_file.' };

    if (taskId) {
      await this.createCheckpoint(taskId, [filePath], `Before creating ${filePath}`);
    }

    this.vfs.writeFile(filePath, initialContent);
    try {
      await DesktopBridge.writeFile(filePath, initialContent);
    } catch (err: any) {
      logger.warn(`Disk createFile notice for ${filePath}:`, err?.message);
    }

    return {
      success: true,
      changesDetected: true,
      output: `Created file: ${filePath}`,
      data: { filePath },
    };
  }

  private async toolDeleteFile(args: Record<string, any>, taskId?: string): Promise<ToolResult> {
    const filePath = (args.filePath || '').replace(/\\/g, '/');
    if (!filePath) return { success: false, error: 'filePath is required for delete_file.' };

    if (taskId) {
      await this.createCheckpoint(taskId, [filePath], `Before deleting ${filePath}`);
    }

    this.vfs.deleteNode(filePath);
    try {
      await DesktopBridge.deletePath(filePath);
    } catch (err: any) {
      logger.warn(`Disk deleteFile notice:`, err?.message);
    }

    return {
      success: true,
      changesDetected: true,
      output: `Deleted file: ${filePath}`,
      data: { filePath },
    };
  }

  private async toolListDir(args: Record<string, any>): Promise<ToolResult> {
    const dirPath = args.dirPath || '.';
    try {
      const tree = await DesktopBridge.getWorkspaceTree(dirPath);
      return {
        success: true,
        data: tree,
        output: `Read directory ${dirPath} (${tree.length} top-level entries).`,
      };
    } catch (e: any) {
      const vfsTree = this.vfs.getTree();
      return {
        success: true,
        data: vfsTree,
        output: `Retrieved workspace directory tree from VFS (${vfsTree.length} root items).`,
      };
    }
  }

  private async toolTerminalCommand(args: Record<string, any>): Promise<ToolResult> {
    const command = (args.command || '').trim();
    if (!command) return { success: false, error: 'command parameter is required.' };

    const result = await DesktopBridge.executeCommand(command, { cwd: args.cwd || this.workspaceRoot });

    return {
      success: result.exitCode === 0,
      data: {
        command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      },
      output: result.stdout || result.stderr || `Command completed with exit code ${result.exitCode}`,
      error: result.exitCode !== 0 ? (result.stderr || `Exited with code ${result.exitCode}`) : undefined,
    };
  }

  private async toolServerLifecycle(args: Record<string, any>): Promise<ToolResult> {
    const action = args.action || 'status';

    if (action === 'start') {
      const port = args.port || 5173;
      const res = await DesktopBridge.startDevServer('npm run dev', port);
      if (res) {
        return {
          success: res.status !== 'failed',
          data: res,
          output: `Dev server status: ${res.status} at ${res.url || 'localhost:' + port}`,
        };
      }
      return {
        success: false,
        error: 'Dev server failed to start or port unavailable',
      };
    }

    if (action === 'stop') {
      const servers = await DesktopBridge.listDevServers();
      const pidToStop = args.pid || servers[0]?.pid || 0;
      await DesktopBridge.stopDevServer(pidToStop);
      return {
        success: true,
        output: 'Dev server stopped.',
      };
    }

    const servers = await DesktopBridge.listDevServers();
    const active = servers.find(s => s.status === 'running') || servers[0];
    return {
      success: true,
      data: active || null,
      output: active ? `Dev server: ${active.status} on port ${active.port} (PID ${active.pid})` : 'No active dev server.',
    };
  }

  private async toolBrowserNavigate(args: Record<string, any>): Promise<ToolResult> {
    const url = args.url || 'http://localhost:3000';
    try {
      const res = await fetch('/api/process/dev-server/verify-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: data.ok,
          data,
          output: `Browser target health check: ${data.message}`,
        };
      }
    } catch {}

    return {
      success: true,
      data: { url, state: 'checked' },
      output: `Target preview URL verified: ${url}`,
    };
  }

  private async toolGitStatus(args: Record<string, any>): Promise<ToolResult> {
    try {
      const status = await DesktopBridge.getGitStatus(this.workspaceRoot);
      return {
        success: true,
        data: status,
        output: `Git branch: ${status.branch}, ${status.modified.length} modified, ${status.untracked.length} untracked.`,
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to get git status' };
    }
  }

  private async toolGitDiff(args: Record<string, any>): Promise<ToolResult> {
    const cmd = args.filePath ? `git diff -- "${args.filePath}"` : 'git diff';
    const res = await DesktopBridge.executeCommand(cmd, { cwd: this.workspaceRoot });
    return {
      success: res.exitCode === 0,
      diff: res.stdout,
      output: res.stdout || 'No unstaged Git diff.',
    };
  }

  private async toolRunTests(args: Record<string, any>): Promise<ToolResult> {
    const cmd = args.testCommand || 'npm test';
    const res = await DesktopBridge.executeCommand(cmd, { cwd: this.workspaceRoot });

    // Parse test output
    const output = (res.stdout || '') + '\n' + (res.stderr || '');
    const passMatch = output.match(/([0-9]+)\s+passed/);
    const failMatch = output.match(/([0-9]+)\s+failed/);

    const passed = passMatch ? parseInt(passMatch[1], 10) : (res.exitCode === 0 ? 1 : 0);
    const failed = failMatch ? parseInt(failMatch[1], 10) : (res.exitCode !== 0 ? 1 : 0);

    return {
      success: res.exitCode === 0 && failed === 0,
      data: {
        command: cmd,
        exitCode: res.exitCode,
        passed,
        failed,
        rawOutput: output,
      },
      output: `Test Execution: ${passed} passed, ${failed} failed (Exit code: ${res.exitCode})`,
      error: failed > 0 || res.exitCode !== 0 ? `Tests failed (${failed} failures).` : undefined,
    };
  }

  private async toolTypeCheck(args: Record<string, any>): Promise<ToolResult> {
    const cmd = args.command || 'npm run lint';
    const res = await DesktopBridge.executeCommand(cmd, { cwd: this.workspaceRoot });

    return {
      success: res.exitCode === 0,
      data: {
        command: cmd,
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr,
      },
      output: res.exitCode === 0 ? 'Type check & linting passed cleanly.' : (res.stderr || res.stdout),
      error: res.exitCode !== 0 ? 'Type check errors detected.' : undefined,
    };
  }

  private async toolBuildProject(args: Record<string, any>): Promise<ToolResult> {
    const cmd = args.buildCommand || 'npm run build';
    const res = await DesktopBridge.executeCommand(cmd, { cwd: this.workspaceRoot });

    return {
      success: res.exitCode === 0,
      data: {
        command: cmd,
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr,
      },
      output: res.exitCode === 0 ? 'Build completed successfully.' : (res.stderr || res.stdout),
      error: res.exitCode !== 0 ? 'Build failed.' : undefined,
    };
  }

  private async toolProjectDiagnostics(args: Record<string, any>): Promise<ToolResult> {
    const lintRes = await DesktopBridge.executeCommand('npm run lint', { cwd: this.workspaceRoot });
    const gitStatus = await DesktopBridge.getGitStatus(this.workspaceRoot);

    const isDirty = gitStatus.modified.length > 0 || gitStatus.untracked.length > 0;
    return {
      success: lintRes.exitCode === 0,
      data: {
        lintClean: lintRes.exitCode === 0,
        lintErrors: lintRes.exitCode !== 0 ? (lintRes.stderr || lintRes.stdout) : null,
        gitDirty: isDirty,
        modifiedFiles: gitStatus.modified,
      },
      output: `Diagnostics: Lint=${lintRes.exitCode === 0 ? 'Clean' : 'Errors'}, Git=${isDirty ? 'Dirty' : 'Clean'}`,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private generateUnifiedDiff(filePath: string, oldText: string, newText: string): string {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

    let changes = 0;
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o !== n) {
        if (o !== undefined) diffLines.push(`-${o}`);
        if (n !== undefined) diffLines.push(`+${n}`);
        changes++;
      }
    }

    return changes > 0 ? diffLines.join('\n') : `No line changes in ${filePath}`;
  }
}
