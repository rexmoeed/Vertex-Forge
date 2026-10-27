import { ToolName, SafetyCheckResult, PermissionMode } from '../../types/autonomousAgent';

export function evaluateToolSafety(
  tool: ToolName,
  args: Record<string, any>,
  permissionMode: PermissionMode
): SafetyCheckResult {
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
        allowed: permissionMode === 'autonomous',
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
    if (permissionMode === 'strict') {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        riskLevel: 'medium',
        reason: `Strict mode requires confirmation for shell command: "${command}"`,
      };
    }

    if (permissionMode === 'supervised') {
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
    if (permissionMode !== 'autonomous') {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        riskLevel: 'medium',
        reason: `File deletion requires approval in ${permissionMode} mode.`,
      };
    }
  }

  if (tool === 'write_file' || tool === 'patch_file' || tool === 'create_file') {
    if (permissionMode === 'strict') {
      return {
        allowed: false,
        requiresExplicitApproval: true,
        riskLevel: 'low',
        reason: `Strict mode requires confirmation before file modification: ${filePath}`,
      };
    }
  }

  // Standard safe path
  return {
    allowed: true,
    requiresExplicitApproval: false,
    riskLevel: 'safe',
  };
}
