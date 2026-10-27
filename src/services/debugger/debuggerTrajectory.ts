import { VirtualFileSystem } from '../virtualFs';

export interface SimulatedExecutionLine {
  line: number;
  name: string;
  vars: Record<string, any>;
  isException?: boolean;
}

export function prepareExecutionTrajectory(
  filePath: string,
  vfs: VirtualFileSystem,
  onSeedFallback?: () => void
): SimulatedExecutionLine[] {
  let content = vfs.readFile(filePath) || '';
  if (!content && filePath.includes('sampleDebugTarget')) {
    if (onSeedFallback) {
      onSeedFallback();
    }
    content = vfs.readFile('src/services/sampleDebugTarget.ts') || '';
  }
  const lines = content.split('\n');

  const simulatedLines: SimulatedExecutionLine[] = [];
  const cumulativeVars: Record<string, any> = {
    sourceFile: filePath,
    prices: [45, 120, 89, 320, 15],
  };

  // Parse executable lines and synthesize actual stack/variable states
  lines.forEach((l, idx) => {
    const trimmed = l.trim();
    const lineNum = idx + 1;

    // Match statements
    if (
      trimmed &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('export interface') &&
      !trimmed.startsWith('type ')
    ) {
      if (trimmed.includes('const') || trimmed.includes('let') || trimmed.includes('var')) {
        const varMatch = trimmed.match(/(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*([^;]+);?/);
        if (varMatch) {
          const varName = varMatch[2];
          const rawVal = varMatch[3].trim();
          try {
            cumulativeVars[varName] = JSON.parse(rawVal);
          } catch {
            cumulativeVars[varName] = rawVal;
          }
        }
      }

      if (
        trimmed.includes('+=') ||
        (trimmed.includes('=') &&
          !trimmed.startsWith('const') &&
          !trimmed.startsWith('let') &&
          !trimmed.startsWith('var') &&
          !trimmed.startsWith('if') &&
          !trimmed.startsWith('for'))
      ) {
        const assignMatch = trimmed.match(/([a-zA-Z0-9_$]+)\s*(\+=|=)\s*([^;]+);?/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const op = assignMatch[2];
          const rawVal = assignMatch[3].trim();
          if (op === '+=') {
            const num = Number(rawVal);
            if (!isNaN(num) && typeof cumulativeVars[varName] === 'number') {
              cumulativeVars[varName] += num;
            } else {
              cumulativeVars[varName] = (cumulativeVars[varName] || 0) + 1;
            }
          } else {
            try {
              cumulativeVars[varName] = JSON.parse(rawVal);
            } catch {
              cumulativeVars[varName] = rawVal;
            }
          }
        }
      }

      // Detect potential division by zero or error assertions
      const isException =
        trimmed.includes('throw new Error') ||
        trimmed.includes('/ 0') ||
        trimmed.includes('.undefinedMethod()');

      simulatedLines.push({
        line: lineNum,
        name: trimmed.slice(0, 40),
        vars: { ...cumulativeVars, stepIndex: simulatedLines.length + 1, line: lineNum },
        isException,
      });
    }
  });

  if (simulatedLines.length === 0) {
    simulatedLines.push({
      line: 1,
      name: 'Entry',
      vars: { ...cumulativeVars, initialized: true },
    });
  }

  return simulatedLines;
}
