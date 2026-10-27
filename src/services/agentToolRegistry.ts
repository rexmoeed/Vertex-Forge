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
import { evaluateToolSafety } from './agent/agentSafetyGuard';
import {
  executeFileSearch,
  executeSymbolSearch,
  executeReadFile,
  executeWriteFile,
  executePatchFile,
  executeCreateFile,
  executeDeleteFile,
  executeListDir,
  generateUnifiedDiff,
} from './agent/agentFsTools';
import {
  executeTerminalCommand,
  executeServerLifecycle,
  executeBrowserNavigate,
  executeGitStatus,
  executeGitDiff,
  executeRunTests,
  executeTypeCheck,
  executeBuildProject,
  executeProjectDiagnostics,
} from './agent/agentSystemTools';

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
    return evaluateToolSafety(tool, args, this.permissionMode);
  }

  // ==========================================
  // CHECKPOINT & ROLLBACK ENGINE
  // ==========================================

  public async createCheckpoint(taskId: string, targetFilePaths: string[], description: string): Promise<FileCheckpoint> {
    const checkpointId = `cp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const files: FileCheckpoint['files'] = [];

    for (const p of targetFilePaths) {
      const cleanPath = p.replace(/\\/g, '/');
      let originalContent: string | null = null;
      let existsBefore = false;

      if (this.vfs.exists(cleanPath)) {
        originalContent = this.vfs.readFile(cleanPath);
        existsBefore = true;
      } else {
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
          this.vfs.deleteNode(item.path);
          await DesktopBridge.deletePath(item.path);
        } else {
          this.vfs.writeFile(item.path, item.originalContent);
          await DesktopBridge.writeFile(item.path, item.originalContent);
        }
        revertedFiles.push(item.path);
      } catch (err: unknown) {
        logger.warn(`Rollback error for ${item.path}:`, err instanceof Error ? err.message : String(err));
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
          result = await executeFileSearch(this.vfs, this.workspaceRoot, args);
          break;
        case 'symbol_search':
          result = await executeSymbolSearch(this.vfs, args);
          break;
        case 'read_file':
          result = await executeReadFile(this.vfs, args);
          break;
        case 'write_file': {
          if (taskId && args.filePath) {
            await this.createCheckpoint(taskId, [args.filePath], `Before writing ${args.filePath}`);
          }
          const { result: writeRes } = await executeWriteFile(this.vfs, args);
          result = writeRes;
          break;
        }
        case 'patch_file': {
          if (taskId && args.filePath) {
            await this.createCheckpoint(taskId, [args.filePath], `Before patching ${args.filePath}`);
          }
          const { result: patchRes } = await executePatchFile(this.vfs, args);
          result = patchRes;
          break;
        }
        case 'create_file': {
          if (taskId && args.filePath) {
            await this.createCheckpoint(taskId, [args.filePath], `Before creating ${args.filePath}`);
          }
          const { result: createRes } = await executeCreateFile(this.vfs, args);
          result = createRes;
          break;
        }
        case 'delete_file': {
          if (taskId && args.filePath) {
            await this.createCheckpoint(taskId, [args.filePath], `Before deleting ${args.filePath}`);
          }
          const { result: deleteRes } = await executeDeleteFile(this.vfs, args);
          result = deleteRes;
          break;
        }
        case 'list_dir':
          result = await executeListDir(this.vfs, args);
          break;
        case 'terminal_command':
          result = await executeTerminalCommand(this.workspaceRoot, args);
          break;
        case 'server_lifecycle':
          result = await executeServerLifecycle(args);
          break;
        case 'browser_navigate':
          result = await executeBrowserNavigate(args);
          break;
        case 'git_status':
          result = await executeGitStatus(this.workspaceRoot);
          break;
        case 'git_diff':
          result = await executeGitDiff(this.workspaceRoot, args);
          break;
        case 'run_tests':
          result = await executeRunTests(this.workspaceRoot, args);
          break;
        case 'type_check':
          result = await executeTypeCheck(this.workspaceRoot, args);
          break;
        case 'build_project':
          result = await executeBuildProject(this.workspaceRoot, args);
          break;
        case 'project_diagnostics':
          result = await executeProjectDiagnostics(this.workspaceRoot);
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
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Tool execution encountered an unhandled exception.',
        durationMs: Date.now() - startTime,
      };
    }
  }

  public generateUnifiedDiff(filePath: string, oldText: string, newText: string): string {
    return generateUnifiedDiff(filePath, oldText, newText);
  }
}
