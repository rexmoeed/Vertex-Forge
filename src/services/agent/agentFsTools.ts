import { ToolResult } from '../../types/autonomousAgent';
import { DesktopBridge } from '../desktopBridge';
import { VirtualFileSystem } from '../virtualFs';
import { logger } from '../logger';

export function generateUnifiedDiff(filePath: string, oldText: string, newText: string): string {
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

export async function executeFileSearch(
  vfs: VirtualFileSystem,
  workspaceRoot: string,
  args: Record<string, any>
): Promise<ToolResult> {
  const query = (args.query || '').trim();
  if (!query) {
    return { success: false, error: 'Query parameter is required for file_search.' };
  }

  try {
    const res = await fetch('/api/fs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, dirPath: workspaceRoot }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        data: data.results || [],
        output: `Found ${(data.results || []).length} matches for "${query}".`,
      };
    }
  } catch {}

  const tree = vfs.getTree();
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

export async function executeSymbolSearch(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<ToolResult> {
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

  vfs.getTree().forEach(searchNode);

  return {
    success: true,
    data: matches,
    output: `Found ${matches.length} symbol declarations matching "${symbol}".`,
  };
}

export async function executeReadFile(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<ToolResult> {
  const filePath = (args.filePath || '').replace(/\\/g, '/');
  if (!filePath) return { success: false, error: 'filePath is required for read_file.' };

  let content: string | null = null;

  if (vfs.exists(filePath)) {
    content = vfs.readFile(filePath);
  } else {
    try {
      content = await DesktopBridge.readFile(filePath);
      if (content !== null) {
        vfs.writeFile(filePath, content);
      }
    } catch {
      return { success: false, error: `File not found: ${filePath}` };
    }
  }

  if (content === null) {
    return { success: false, error: `Failed to read ${filePath}` };
  }

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

export async function executeWriteFile(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<{ result: ToolResult; filePath: string }> {
  const filePath = (args.filePath || '').replace(/\\/g, '/');
  const content = args.content !== undefined ? args.content : '';
  if (!filePath) {
    return { result: { success: false, error: 'filePath is required for write_file.' }, filePath: '' };
  }

  const previousContent = vfs.readFile(filePath) ?? '';
  const diff = generateUnifiedDiff(filePath, previousContent, content);

  vfs.writeFile(filePath, content);

  try {
    await DesktopBridge.writeFile(filePath, content);
  } catch (err: unknown) {
    logger.warn(`Real disk write warning for ${filePath}:`, err instanceof Error ? err.message : String(err));
  }

  return {
    result: {
      success: true,
      changesDetected: previousContent !== content,
      diff,
      data: { filePath, bytesWritten: content.length },
      output: `Successfully wrote ${filePath} (${content.length} bytes).`,
    },
    filePath,
  };
}

export async function executePatchFile(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<{ result: ToolResult; filePath: string }> {
  const filePath = (args.filePath || '').replace(/\\/g, '/');
  const targetString = args.targetString;
  const replacementString = args.replacementString;

  if (!filePath || targetString === undefined || replacementString === undefined) {
    return {
      result: { success: false, error: 'filePath, targetString, and replacementString are required.' },
      filePath: '',
    };
  }

  let current = vfs.readFile(filePath);
  if (current === null) {
    try {
      current = await DesktopBridge.readFile(filePath);
    } catch {
      return { result: { success: false, error: `File not found to patch: ${filePath}` }, filePath };
    }
  }

  if (!current.includes(targetString)) {
    return {
      result: {
        success: false,
        error: `Target string was not found in ${filePath}. Check indentation or whitespace.`,
      },
      filePath,
    };
  }

  const patched = current.replace(targetString, replacementString);
  const diff = generateUnifiedDiff(filePath, current, patched);

  vfs.writeFile(filePath, patched);
  await DesktopBridge.writeFile(filePath, patched);

  return {
    result: {
      success: true,
      changesDetected: true,
      diff,
      output: `Patched ${filePath} successfully.`,
    },
    filePath,
  };
}

export async function executeCreateFile(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<{ result: ToolResult; filePath: string }> {
  const filePath = (args.filePath || '').replace(/\\/g, '/');
  const initialContent = args.initialContent || '';
  if (!filePath) {
    return { result: { success: false, error: 'filePath is required for create_file.' }, filePath: '' };
  }

  vfs.writeFile(filePath, initialContent);
  try {
    await DesktopBridge.writeFile(filePath, initialContent);
  } catch (err: unknown) {
    logger.warn(`Disk createFile notice for ${filePath}:`, err instanceof Error ? err.message : String(err));
  }

  return {
    result: {
      success: true,
      changesDetected: true,
      output: `Created file: ${filePath}`,
      data: { filePath },
    },
    filePath,
  };
}

export async function executeDeleteFile(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<{ result: ToolResult; filePath: string }> {
  const filePath = (args.filePath || '').replace(/\\/g, '/');
  if (!filePath) {
    return { result: { success: false, error: 'filePath is required for delete_file.' }, filePath: '' };
  }

  vfs.deleteNode(filePath);
  try {
    await DesktopBridge.deletePath(filePath);
  } catch (err: unknown) {
    logger.warn(`Disk deleteFile notice:`, err instanceof Error ? err.message : String(err));
  }

  return {
    result: {
      success: true,
      changesDetected: true,
      output: `Deleted file: ${filePath}`,
      data: { filePath },
    },
    filePath,
  };
}

export async function executeListDir(
  vfs: VirtualFileSystem,
  args: Record<string, any>
): Promise<ToolResult> {
  const dirPath = args.dirPath || '.';
  try {
    const tree = await DesktopBridge.getWorkspaceTree(dirPath);
    return {
      success: true,
      data: tree,
      output: `Read directory ${dirPath} (${tree.length} top-level entries).`,
    };
  } catch {
    const vfsTree = vfs.getTree();
    return {
      success: true,
      data: vfsTree,
      output: `Retrieved workspace directory tree from VFS (${vfsTree.length} root items).`,
    };
  }
}
