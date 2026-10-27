import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import { GoogleGenAI } from '@google/genai';
import { createProjectRouter } from './project.routes';
import { createSecurityRouter } from './security.routes';
import { createTestDiagnosisRouter } from './testDiagnosis.routes';

const execAsync = util.promisify(exec);

async function scanTestFiles(
  dir: string,
  baseDir: string = dir
): Promise<Array<{ path: string; suite: 'unit' | 'integration' | 'component' | 'e2e'; framework: 'vitest' | 'jest' | 'mocha' }>> {
  const results: Array<{ path: string; suite: 'unit' | 'integration' | 'component' | 'e2e'; framework: 'vitest' | 'jest' | 'mocha' }> = [];
  try {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === '.vitest') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = await scanTestFiles(fullPath, baseDir);
        results.push(...sub);
      } else if (entry.isFile()) {
        const relative = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          let suite: 'unit' | 'integration' | 'component' | 'e2e' = 'unit';
          if (relative.includes('/e2e/') || relative.includes('.e2e.')) suite = 'e2e';
          else if (relative.includes('/integration/') || relative.includes('.integration.')) suite = 'integration';
          else if (relative.includes('/component/') || relative.includes('.component.')) suite = 'component';

          results.push({
            path: relative,
            suite,
            framework: 'vitest',
          });
        }
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export function createTestRouter(getAiClient: () => GoogleGenAI | null): Router {
  const router = Router();

  // Mount decomposed sub-routers
  router.use(createProjectRouter());
  router.use(createSecurityRouter());
  router.use(createTestDiagnosisRouter(getAiClient));

  // Test Discovery Endpoint
  router.post('/api/test/discover', async (req: Request, res: Response) => {
    const { cwd } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

    try {
      let pkg: any = {};
      const pkgPath = path.join(targetCwd, 'package.json');
      if (fs.existsSync(pkgPath)) {
        pkg = JSON.parse(await fsPromises.readFile(pkgPath, 'utf-8'));
      }

      const scripts = pkg.scripts || {};
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      let framework: any = 'vitest';
      if (deps['vitest']) framework = 'vitest';
      else if (deps['jest']) framework = 'jest';
      else if (deps['mocha']) framework = 'mocha';
      else if (deps['@playwright/test']) framework = 'playwright';
      else if (deps['cypress']) framework = 'cypress';

      const testFiles = await scanTestFiles(targetCwd);

      const discoveredScripts: any[] = [];
      if (scripts['test']) discoveredScripts.push({ name: 'test', command: scripts['test'], kind: 'unit' });
      if (scripts['test:unit']) discoveredScripts.push({ name: 'test:unit', command: scripts['test:unit'], kind: 'unit' });
      if (scripts['test:e2e']) discoveredScripts.push({ name: 'test:e2e', command: scripts['test:e2e'], kind: 'e2e' });
      if (scripts['typecheck']) discoveredScripts.push({ name: 'typecheck', command: scripts['typecheck'], kind: 'typecheck' });
      if (scripts['lint']) discoveredScripts.push({ name: 'lint', command: scripts['lint'], kind: 'lint' });
      if (scripts['build']) discoveredScripts.push({ name: 'build', command: scripts['build'], kind: 'build' });

      let configFile = undefined;
      if (fs.existsSync(path.join(targetCwd, 'vitest.config.ts'))) configFile = 'vitest.config.ts';
      else if (fs.existsSync(path.join(targetCwd, 'vite.config.ts'))) configFile = 'vite.config.ts';
      else if (fs.existsSync(path.join(targetCwd, 'jest.config.js'))) configFile = 'jest.config.js';

      return res.json({
        framework,
        version: deps['vitest'] || deps['jest'] || '5.0.2',
        configFile,
        scripts: discoveredScripts,
        testFiles,
        typecheckCommand: scripts['typecheck'] ? 'npm run typecheck' : 'npx tsc --noEmit',
        lintCommand: scripts['lint'] ? 'npm run lint' : 'npx eslint .',
        buildCommand: scripts['build'] ? 'npm run build' : 'npm run build',
        capabilities: {
          canRunSingleFile: true,
          canFilterByName: true,
          canRerunFailed: true,
          canTypecheck: true,
          canLint: true,
          canBuild: true,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg || 'Failed to discover tests' });
    }
  });

  // Test Runner Execution Endpoint
  router.post('/api/test/run', async (req: Request, res: Response) => {
    const { target = 'all', testFile, filter, failedFiles, cwd } = req.body;
    const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
    const startTime = Date.now();

    let command = 'npx vitest run';
    if (target === 'typecheck') {
      command = 'npx tsc --noEmit';
    } else if (target === 'lint') {
      command = 'npm run lint';
    } else if (target === 'build') {
      command = 'npm run build';
    } else if (target === 'file' && testFile) {
      command = `npx vitest run "${testFile}"`;
    } else if (target === 'selected' && filter) {
      command = `npx vitest run -t "${filter}"`;
    } else if (target === 'failed' && Array.isArray(failedFiles) && failedFiles.length > 0) {
      command = `npx vitest run ${failedFiles.map((f: string) => `"${f}"`).join(' ')}`;
    }

    const isVitest = !['typecheck', 'lint', 'build'].includes(target);
    const fullCommand = isVitest ? `${command} --reporter=json --reporter=verbose` : command;

    try {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      try {
        const resExec = await execAsync(fullCommand, {
          cwd: targetCwd,
          maxBuffer: 15 * 1024 * 1024,
          timeout: 90000,
        });
        stdout = resExec.stdout || '';
        stderr = resExec.stderr || '';
      } catch (err: any) {
        exitCode = typeof err.code === 'number' ? err.code : 1;
        stdout = err.stdout || '';
        stderr = err.stderr || err.message || '';
      }

      const durationMs = Date.now() - startTime;
      const rawOutput = (stdout + '\n' + stderr).trim();

      let total = 0;
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      const tests: any[] = [];

      const jsonOutputPath = path.join(targetCwd, '.vitest', 'json', 'output.json');
      let parsedJson = false;

      if (isVitest && fs.existsSync(jsonOutputPath)) {
        try {
          const jsonContent = await fsPromises.readFile(jsonOutputPath, 'utf-8');
          const report = JSON.parse(jsonContent);
          total = report.numTotalTests || 0;
          passed = report.numPassedTests || 0;
          failed = report.numFailedTests || 0;
          skipped = (report.numPendingTests || 0) + (report.numTodoTests || 0);

          if (Array.isArray(report.testResults)) {
            for (const suite of report.testResults) {
              const suiteRelPath = path.relative(targetCwd, suite.name).replace(/\\/g, '/');
              if (Array.isArray(suite.assertionResults)) {
                for (const assert of suite.assertionResults) {
                  const failureMsg = (assert.failureMessages || []).join('\n');
                  let location: any = undefined;
                  if (failureMsg) {
                    const locMatch = failureMsg.match(/([a-zA-Z0-9_\-./]+\.(?:ts|tsx|js|jsx)):(\d+)(?::(\d+))?/);
                    if (locMatch) {
                      location = {
                        filePath: locMatch[1].replace(/^\/app\/applet\//, ''),
                        line: Number(locMatch[2]),
                        column: locMatch[3] ? Number(locMatch[3]) : undefined,
                      };
                    }
                  }

                  tests.push({
                    id: `${suiteRelPath}-${assert.title}`,
                    name: assert.title,
                    suiteName: (assert.ancestorTitles || []).join(' > ') || suiteRelPath,
                    filePath: suiteRelPath,
                    status: assert.status === 'passed' ? 'passed' : assert.status === 'failed' ? 'failed' : 'skipped',
                    durationMs: Math.round(assert.duration || 0),
                    errorMessage: failureMsg ? failureMsg.split('\n')[0] : undefined,
                    errorStack: failureMsg || undefined,
                    location,
                  });
                }
              }
            }
          }
          parsedJson = true;
        } catch {
          // Fallback to text parsing
        }
      }

      if (!parsedJson) {
        if (target === 'typecheck') {
          const errorLines = rawOutput.split('\n').filter(l => l.includes('error TS'));
          failed = errorLines.length;
          passed = exitCode === 0 ? 1 : 0;
          total = passed + failed;
          tests.push({
            id: 'typecheck-suite',
            name: 'TypeScript Compilation & Type Safety',
            suiteName: 'Static Type Checking',
            filePath: 'tsconfig.json',
            status: exitCode === 0 ? 'passed' : 'failed',
            durationMs,
            errorMessage: failed > 0 ? `${failed} type errors found` : undefined,
            errorStack: rawOutput,
          });
        } else if (target === 'lint') {
          failed = exitCode === 0 ? 0 : 1;
          passed = exitCode === 0 ? 1 : 0;
          total = 1;
          tests.push({
            id: 'lint-suite',
            name: 'ESLint Code Quality Verification',
            suiteName: 'Linting Analysis',
            filePath: 'eslint.config.js',
            status: exitCode === 0 ? 'passed' : 'failed',
            durationMs,
            errorMessage: exitCode !== 0 ? 'Lint violations found' : undefined,
            errorStack: rawOutput,
          });
        } else if (target === 'build') {
          failed = exitCode === 0 ? 0 : 1;
          passed = exitCode === 0 ? 1 : 0;
          total = 1;
          tests.push({
            id: 'build-suite',
            name: 'Production Asset Bundle & Compilation',
            suiteName: 'Vite Build Verification',
            filePath: 'vite.config.ts',
            status: exitCode === 0 ? 'passed' : 'failed',
            durationMs,
            errorMessage: exitCode !== 0 ? 'Build failed' : undefined,
            errorStack: rawOutput,
          });
        } else {
          const lines = rawOutput.split('\n');
          for (const line of lines) {
            const match = line.match(/(✓|×)\s+(.*?)\s+\((\d+)\s*ms\)/);
            if (match) {
              const isPass = match[1] === '✓';
              const name = match[2];
              const dur = Number(match[3]);
              if (isPass) passed++;
              else failed++;
              total++;
              tests.push({
                id: `test-${total}`,
                name,
                suiteName: testFile || 'Test Suite',
                filePath: testFile || 'tests',
                status: isPass ? 'passed' : 'failed',
                durationMs: dur,
              });
            }
          }
          if (total === 0) {
            passed = exitCode === 0 ? 1 : 0;
            failed = exitCode === 0 ? 0 : 1;
            total = 1;
          }
        }
      }

      return res.json({
        runId: `run-${Date.now()}`,
        timestamp: new Date().toISOString(),
        target,
        command: fullCommand,
        exitCode,
        durationMs,
        total,
        passed,
        failed,
        skipped,
        tests,
        rawOutput,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg || 'Failed to execute test run' });
    }
  });

  return router;
}
