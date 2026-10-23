import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { TerminalLine, TestResult, ProblemDiagnostic } from '../types/ide';
import { TerminalRunner } from '../services/terminalRunner';
import { VirtualFileSystem } from '../services/virtualFs';
import { IDEBuildRunner } from '../services/ideBuildRunner';
import { ProjectProfile } from '../types/project';

export interface TerminalContextType {
  terminalHistory: TerminalLine[];
  testResults: TestResult[];
  problems: ProblemDiagnostic[];
  runner: TerminalRunner;
  setRunner: React.Dispatch<React.SetStateAction<TerminalRunner>>;
  setTerminalHistory: React.Dispatch<React.SetStateAction<TerminalLine[]>>;
  setTestResults: React.Dispatch<React.SetStateAction<TestResult[]>>;
  setProblems: React.Dispatch<React.SetStateAction<ProblemDiagnostic[]>>;
  runCommand: (cmd: string) => Promise<void>;
  clearTerminal: () => void;
  runTests: (activeFile?: string | null, onLog?: (agent: any, msg: string, status: any) => void) => Promise<void>;
  runBuild: (projectProfile?: ProjectProfile | null, activeFile?: string | null, onLog?: (agent: any, msg: string, status: any) => void) => Promise<void>;
  runLint: (onLog?: (agent: any, msg: string, status: any) => void) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: ReactNode; vfs?: VirtualFileSystem }> = ({ children, vfs }) => {
  const [activeVfs] = useState<VirtualFileSystem>(() => vfs || new VirtualFileSystem([]));
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { id: '1', text: 'Vertex Forge Terminal v1.2.5 initialized.', type: 'system', timestamp: new Date().toLocaleTimeString() },
    { id: '2', text: 'Type "help" for a list of available development commands.', type: 'stdout', timestamp: new Date().toLocaleTimeString() },
  ]);
  const [runner, setRunner] = useState<TerminalRunner>(() => new TerminalRunner(activeVfs));
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [problems, setProblems] = useState<ProblemDiagnostic[]>([]);

  const runCommand = useCallback(async (cmd: string) => {
    const lines = await IDEBuildRunner.executeCommand(cmd, runner);
    setTerminalHistory(prev => [...prev, ...lines]);
  }, [runner]);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  const runTests = useCallback(async (activeFile?: string | null, onLog?: (agent: any, msg: string, status: any) => void) => {
    onLog?.('Testing', 'Running test suite...', 'info');
    const res = await IDEBuildRunner.runTests(runner, activeFile || undefined);
    setTerminalHistory(prev => [...prev, ...res.lines]);
    setTestResults(res.testResults);
    onLog?.(
      'Testing',
      `Test suite execution complete: ${res.passed ? 'All assertions passed' : 'Failures detected'} (exit ${res.exitCode})`,
      res.passed ? 'success' : 'error'
    );
  }, [runner]);

  const runBuild = useCallback(async (projectProfile?: ProjectProfile | null, activeFile?: string | null, onLog?: (agent: any, msg: string, status: any) => void) => {
    onLog?.('Developer', 'Starting build compilation...', 'info');
    const res = await IDEBuildRunner.runBuild(projectProfile || null, activeFile || null);
    setTerminalHistory(prev => [...prev, ...res.lines]);
    if (res.diagnostic) {
      setProblems(prev => [...prev, res.diagnostic!]);
    }
    onLog?.(
      'Developer',
      res.success ? 'Build succeeded with 0 errors' : `Build failed with code ${res.exitCode}`,
      res.success ? 'success' : 'error'
    );
  }, []);

  const runLint = useCallback((onLog?: (agent: any, msg: string, status: any) => void) => {
    const res = IDEBuildRunner.runLint(runner);
    setTerminalHistory(prev => [...prev, ...res.lines]);
    setProblems(res.diagnostics);
    onLog?.('Reviewer', `Static analysis found ${res.diagnostics.length} problems`, res.exitCode === 0 ? 'success' : 'warning');
  }, [runner]);

  const value = useMemo<TerminalContextType>(() => ({
    terminalHistory,
    testResults,
    problems,
    runner,
    setRunner,
    setTerminalHistory,
    setTestResults,
    setProblems,
    runCommand,
    clearTerminal,
    runTests,
    runBuild,
    runLint,
  }), [terminalHistory, testResults, problems, runner, runCommand, clearTerminal, runTests, runBuild, runLint]);

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
};

export const useTerminal = (): TerminalContextType => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
