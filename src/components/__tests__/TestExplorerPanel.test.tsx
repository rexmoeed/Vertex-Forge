import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestExplorerPanel } from '../testing/TestExplorerPanel';
import { TestEngineService } from '../../services/testEngineService';

vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    openFile: vi.fn(),
    activeFile: null,
    logAgentAction: vi.fn(),
    refreshGit: vi.fn(),
  }),
}));

vi.mock('../../services/testEngineService', () => ({
  TestEngineService: {
    discoverTests: vi.fn(),
    runTests: vi.fn(),
    runAll: vi.fn(),
    runTypecheck: vi.fn(),
    runLint: vi.fn(),
    runBuild: vi.fn(),
    diagnoseFailure: vi.fn(),
    selfRepair: vi.fn(),
  },
}));

describe('TestExplorerPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TestEngineService.discoverTests).mockResolvedValue({
      framework: 'vitest',
      totalFiles: 1,
      totalTests: 2,
      testFiles: [
        { path: 'src/test1.test.ts', testCount: 2, passed: 2, failed: 0 },
      ],
      suites: [
        { file: 'src/test1.test.ts', tests: ['test 1', 'test 2'] },
      ],
    } as any);
  });

  it('renders test execution shortcuts and action buttons', () => {
    render(<TestExplorerPanel />);
    expect(screen.getAllByTitle('Run TypeScript Type Checks')[0]).toBeDefined();
    expect(screen.getAllByTitle('Run Linting Analysis')[0]).toBeDefined();
    expect(screen.getAllByTitle('Run Production Build')[0]).toBeDefined();
  });

  it('switches between Explorer and Terminal Output view modes', () => {
    render(<TestExplorerPanel />);
    const rawBtn = screen.getAllByRole('button', { name: /Terminal Output/i })[0];
    fireEvent.click(rawBtn);
    expect(rawBtn).toBeDefined();

    const explorerBtn = screen.getAllByRole('button', { name: /Explorer/i })[0];
    fireEvent.click(explorerBtn);
    expect(explorerBtn).toBeDefined();
  });

  it('triggers discovery refresh when refresh button is clicked', async () => {
    render(<TestExplorerPanel />);
    const refreshBtn = screen.getAllByTitle('Refresh Test Discovery')[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(TestEngineService.discoverTests).toHaveBeenCalled();
    });
  });

  it('triggers test execution when Typecheck shortcut is clicked', async () => {
    vi.mocked(TestEngineService.runTypecheck).mockResolvedValueOnce({
      total: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      durationMs: 150,
      tests: [],
    } as any);

    render(<TestExplorerPanel />);
    const typecheckBtn = screen.getAllByTitle('Run TypeScript Type Checks')[0];
    fireEvent.click(typecheckBtn);

    await waitFor(() => {
      expect(TestEngineService.runTypecheck).toHaveBeenCalled();
    });
  });
});
