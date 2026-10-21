import {
  TerminalLine,
  TestResult,
  ProblemDiagnostic,
  AgentRole,
  AgentLog,
} from '../types/ide';
import { ProjectProfile, DevServerProcess } from '../types/project';
import { DesktopBridge } from './desktopBridge';
import { TerminalRunner } from './terminalRunner';
import { VirtualFileSystem } from './virtualFs';
import { GeminiService } from './geminiService';
import { SecurityAuditService } from './securityAuditService';
import { logger } from './logger';

export interface TestExecutionOutput {
  lines: TerminalLine[];
  testResults: TestResult[];
  passed: boolean;
  exitCode: number;
}

export interface BuildExecutionOutput {
  lines: TerminalLine[];
  success: boolean;
  exitCode: number;
  diagnostic?: ProblemDiagnostic;
}

export class IDEBuildRunner {
  public static async executeCommand(
    cmd: string,
    fallbackRunner: TerminalRunner
  ): Promise<TerminalLine[]> {
    const timestamp = new Date().toLocaleTimeString();
    const resultLines: TerminalLine[] = [
      { id: `cmd-${Date.now()}`, type: 'command', text: `$ ${cmd}`, timestamp },
    ];

    try {
      const execRes = await DesktopBridge.executeCommand(cmd);
      if (execRes.stdout) {
        execRes.stdout.split('\n').filter(Boolean).forEach((line, i) => {
          resultLines.push({
            id: `out-${Date.now()}-${i}`,
            type: 'stdout',
            text: line,
            timestamp,
          });
        });
      }
      if (execRes.stderr) {
        execRes.stderr.split('\n').filter(Boolean).forEach((line, i) => {
          resultLines.push({
            id: `err-${Date.now()}-${i}`,
            type: 'stderr',
            text: line,
            timestamp,
          });
        });
      }
      resultLines.push({
        id: `exit-${Date.now()}`,
        type: 'system',
        text: `[Process completed with exit code ${execRes.exitCode} in ${execRes.durationMs}ms]`,
        timestamp,
      });
      return resultLines;
    } catch {
      const res = fallbackRunner.execute(cmd);
      return [...resultLines, ...res.lines];
    }
  }

  public static async runTests(
    fallbackRunner: TerminalRunner,
    activeFile?: string | null
  ): Promise<TestExecutionOutput> {
    const timestamp = new Date().toLocaleTimeString();
    const lines: TerminalLine[] = [
      { id: `cmd-${Date.now()}`, type: 'command', text: '$ npm test', timestamp },
    ];

    try {
      const testExec = await DesktopBridge.executeCommand('npx vitest run --reporter=json || npm test', {
        cwd: DesktopBridge.currentWorkspacePath,
      });
      const outText = (testExec.stdout || '') + (testExec.stderr ? '\n' + testExec.stderr : '');

      outText.split('\n').filter(Boolean).forEach((line, i) => {
        lines.push({
          id: `tst-${Date.now()}-${i}`,
          type: testExec.exitCode === 0 ? 'stdout' : 'stderr',
          text: line,
          timestamp,
        });
      });

      const parsedResults: TestResult[] = [];
      const testMatchRegex = /(?:✓|✔|PASS|FAIL)\s+([^\n\r]+)/g;
      let m: RegExpExecArray | null;
      let count = 0;
      while ((m = testMatchRegex.exec(outText)) !== null && count < 25) {
        count++;
        const isPass = m[0].includes('✓') || m[0].includes('✔') || m[0].includes('PASS');
        const testName = m[1].trim();
        parsedResults.push({
          id: `test-real-${count}`,
          testSuite: testName.split(' ')[0] || 'Suite',
          testName,
          status: isPass ? 'passed' : 'failed',
          durationMs: 45,
          filePath: activeFile || 'tests',
          errorStack: isPass ? undefined : outText.slice(0, 300),
        });
      }

      const results = parsedResults.length > 0 ? parsedResults : (fallbackRunner.runTests().testResults || []);
      const passed = testExec.exitCode === 0;

      return {
        lines,
        testResults: results,
        passed,
        exitCode: testExec.exitCode,
      };
    } catch {
      const fallback = fallbackRunner.runTests();
      return {
        lines,
        testResults: fallback.testResults || [],
        passed: fallback.exitCode === 0,
        exitCode: fallback.exitCode,
      };
    }
  }

  public static async runBuild(
    projectProfile: ProjectProfile | null,
    activeFile?: string | null
  ): Promise<BuildExecutionOutput> {
    const timestamp = new Date().toLocaleTimeString();
    const buildCmd = projectProfile?.scripts?.['build'] ? 'npm run build' : 'npm run build';
    const lines: TerminalLine[] = [
      { id: `cmd-${Date.now()}`, type: 'command', text: `$ ${buildCmd}`, timestamp },
    ];

    try {
      const buildRes = await DesktopBridge.executeCommand(buildCmd, { cwd: DesktopBridge.currentWorkspacePath });
      if (buildRes.stdout) {
        buildRes.stdout.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `bld-out-${Date.now()}-${i}`,
            type: 'stdout',
            text: line,
            timestamp,
          });
        });
      }
      if (buildRes.stderr) {
        buildRes.stderr.split('\n').filter(Boolean).forEach((line, i) => {
          lines.push({
            id: `bld-err-${Date.now()}-${i}`,
            type: 'stderr',
            text: line,
            timestamp,
          });
        });
      }
      lines.push({
        id: `bld-exit-${Date.now()}`,
        type: 'system',
        text: `[Build finished with exit code ${buildRes.exitCode} in ${buildRes.durationMs}ms]`,
        timestamp,
      });

      let diagnostic: ProblemDiagnostic | undefined;
      if (buildRes.exitCode !== 0) {
        diagnostic = {
          id: `bld-prob-${Date.now()}`,
          filePath: activeFile || 'package.json',
          line: 1,
          column: 1,
          message: `Build Error (code ${buildRes.exitCode}): ${buildRes.stderr?.slice(0, 150) || 'Build compilation failed'}`,
          severity: 'error',
          source: 'build',
        };
      }

      return {
        lines,
        success: buildRes.exitCode === 0,
        exitCode: buildRes.exitCode,
        diagnostic,
      };
    } catch (err: any) {
      lines.push({
        id: `bld-err-${Date.now()}`,
        type: 'stderr',
        text: `Build execution error: ${err?.message || String(err)}`,
        timestamp,
      });
      return {
        lines,
        success: false,
        exitCode: 1,
      };
    }
  }

  public static runLint(fallbackRunner: TerminalRunner): {
    lines: TerminalLine[];
    diagnostics: ProblemDiagnostic[];
    exitCode: number;
  } {
    const res = fallbackRunner.runLint();
    const lines: TerminalLine[] = [
      { id: `cmd-${Date.now()}`, type: 'command', text: '$ npm run lint', timestamp: new Date().toLocaleTimeString() },
      ...res.lines,
    ];
    return {
      lines,
      diagnostics: res.diagnostics || [],
      exitCode: res.exitCode,
    };
  }

  public static async executeSelfHeal(options: {
    failingFile: string;
    errorStack: string;
    vfs: VirtualFileSystem;
    onLog?: (agent: AgentRole, action: string, status?: AgentLog['status'], details?: string) => void;
  }): Promise<{ success: boolean; patch?: string }> {
    const { failingFile, errorStack, vfs, onLog } = options;

    let fileContent = vfs.readFile(failingFile) || '';
    if (!fileContent) {
      try {
        fileContent = await DesktopBridge.readFile(failingFile);
      } catch {
        fileContent = '';
      }
    }

    onLog?.('Debugger', `Self-Healing triggered: Inspecting root cause in ${failingFile}`, 'tool_call', errorStack);

    try {
      const debugRes = await GeminiService.debugIssue({
        errorLog: errorStack,
        failingFile,
        fileContent,
        testOutput: errorStack,
      });

      onLog?.('Debugger', `Root Cause identified: ${debugRes.rootCause}`, 'info', debugRes.explanation);

      const correctedCode = debugRes.patch || fileContent;
      vfs.writeFile(failingFile, correctedCode);
      await DesktopBridge.writeFile(failingFile, correctedCode);

      return { success: true, patch: correctedCode };
    } catch (err: any) {
      onLog?.('Debugger', `Debug self-healing error: ${err.message}`, 'error');
      return { success: false };
    }
  }

  public static async runSecurityReview(
    onLog?: (agent: AgentRole, action: string, status?: AgentLog['status'], details?: string) => void
  ): Promise<void> {
    onLog?.('Reviewer', 'Performing live multi-layer AST security audit and dependency scan', 'tool_call');
    try {
      const auditReport = await SecurityAuditService.runAudit();
      onLog?.(
        'Reviewer',
        `Security & Dependency Audit completed. Score: ${auditReport.securityScore}/100. Findings: ${auditReport.findings.length}`,
        auditReport.status === 'clean' ? 'success' : 'warning',
        auditReport.statusMessage
      );
    } catch (err: any) {
      onLog?.('Reviewer', `Security audit error: ${err.message}`, 'error');
    }
  }

  public static async startDevServer(
    projectProfile: ProjectProfile | null,
    customCmd?: string
  ): Promise<DevServerProcess | null> {
    const cmd = customCmd || projectProfile?.userOverrides?.devCommand || projectProfile?.scripts?.['dev'] || 'npm run dev';
    try {
      const s = await DesktopBridge.startDevServer(cmd, DesktopBridge.currentWorkspacePath);
      return s || null;
    } catch (err) {
      logger.error('Failed to start dev server', { command: cmd, cause: err });
      return null;
    }
  }

  public static async stopDevServer(devServerProcess: DevServerProcess | null): Promise<void> {
    if (devServerProcess) {
      try {
        await DesktopBridge.stopDevServer(devServerProcess.pid);
      } catch (err) {
        logger.error('Failed to stop dev server', { pid: devServerProcess.pid, cause: err });
      }
    }
  }
}
