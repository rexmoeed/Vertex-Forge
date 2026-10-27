import { VirtualFileSystem } from '../virtualFs';
import { DesktopBridge } from '../desktopBridge';
import { logger } from '../logger';

export type EvidenceCategory = 'VERIFIED' | 'INFERRED' | 'UNKNOWN';

export interface ToolCallResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  result: any;
  error?: string;
  evidenceCategory: EvidenceCategory;
}

export class UniversalToolExecutor {
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    vfs?: VirtualFileSystem
  ): Promise<ToolCallResult> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    try {
      switch (toolName) {
        case 'fs_read_file': {
          const filePath = args.filePath;
          if (!filePath) throw new Error('filePath is required');

          if (vfs) {
            const content = vfs.readFile(filePath);
            if (content !== null) {
              return {
                toolCallId: callId,
                toolName,
                success: true,
                result: { content, path: filePath },
                evidenceCategory: 'VERIFIED',
              };
            }
          }

          try {
            const diskContent = await DesktopBridge.readFile(filePath);
            return {
              toolCallId: callId,
              toolName,
              success: true,
              result: diskContent,
              evidenceCategory: 'VERIFIED',
            };
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
              toolCallId: callId,
              toolName,
              success: false,
              result: null,
              error: msg,
              evidenceCategory: 'UNKNOWN',
            };
          }
        }

        case 'fs_write_file': {
          const { filePath, content } = args;
          if (!filePath || content === undefined) throw new Error('filePath and content are required');

          if (vfs) {
            vfs.writeFile(filePath, content);
          }
          await DesktopBridge.writeFile(filePath, content);

          return {
            toolCallId: callId,
            toolName,
            success: true,
            result: { path: filePath, bytesWritten: content.length },
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'fs_list_directory': {
          const dirPath = args.dirPath || '';
          if (vfs) {
            const entries = vfs.listDirectory(dirPath);
            return {
              toolCallId: callId,
              toolName,
              success: true,
              result: entries,
              evidenceCategory: 'VERIFIED',
            };
          }

          const tree = await DesktopBridge.getWorkspaceTree(dirPath || DesktopBridge.currentWorkspacePath);
          return {
            toolCallId: callId,
            toolName,
            success: true,
            result: tree,
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'terminal_execute': {
          const cmd = args.command;
          if (!cmd) throw new Error('command is required');
          const execRes = await DesktopBridge.executeCommand(cmd);

          return {
            toolCallId: callId,
            toolName,
            success: execRes.exitCode === 0,
            result: {
              exitCode: execRes.exitCode,
              stdout: execRes.stdout,
              stderr: execRes.stderr,
            },
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'git_status': {
          const statusRes = await DesktopBridge.getGitStatus(DesktopBridge.currentWorkspacePath);
          return {
            toolCallId: callId,
            toolName,
            success: true,
            result: statusRes,
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'git_diff': {
          const diffRes = await DesktopBridge.getGitDiff(DesktopBridge.currentWorkspacePath, args.filePath);
          return {
            toolCallId: callId,
            toolName,
            success: true,
            result: diffRes,
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'run_tests': {
          const testRes = await DesktopBridge.executeCommand('npx vitest run --reporter=json || npm test');
          return {
            toolCallId: callId,
            toolName,
            success: testRes.exitCode === 0,
            result: testRes.stdout || testRes.stderr,
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'run_build': {
          const buildRes = await DesktopBridge.executeCommand('npm run build');
          return {
            toolCallId: callId,
            toolName,
            success: buildRes.exitCode === 0,
            result: buildRes.stdout || buildRes.stderr,
            evidenceCategory: 'VERIFIED',
          };
        }

        case 'codebase_search': {
          const query = args.query;
          if (!query) throw new Error('query is required');

          if (vfs) {
            const matches = vfs.searchFiles(query);
            return {
              toolCallId: callId,
              toolName,
              success: true,
              result: matches.slice(0, 10),
              evidenceCategory: 'VERIFIED',
            };
          }

          const results = await DesktopBridge.searchWorkspace(query);
          return {
            toolCallId: callId,
            toolName,
            success: true,
            result: results.slice(0, 10),
            evidenceCategory: 'VERIFIED',
          };
        }

        default:
          return {
            toolCallId: callId,
            toolName,
            success: false,
            result: null,
            error: `Unknown tool: ${toolName}`,
            evidenceCategory: 'UNKNOWN',
          };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tool execution failed';
      logger.error('UniversalToolExecutor failed', { toolName }, err);
      return {
        toolCallId: callId,
        toolName,
        success: false,
        result: null,
        error: msg,
        evidenceCategory: 'UNKNOWN',
      };
    }
  }
}
