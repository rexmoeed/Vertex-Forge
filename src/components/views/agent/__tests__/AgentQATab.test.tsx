import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { AgentQATab } from '../AgentQATab';

afterEach(cleanup);

describe('AgentQATab Component', () => {
  it('renders green state when all test suites pass', () => {
    const mockTests = [
      { id: '1', testName: 'validates schema', testSuite: 'schema.test.ts', status: 'passed' },
      { id: '2', testName: 'handles auth', testSuite: 'auth.test.ts', status: 'passed' },
    ];
    render(
      <AgentQATab
        testResults={mockTests}
        failedTests={0}
        runTests={vi.fn()}
        triggerSelfHealDebug={vi.fn()}
      />
    );

    expect(screen.getByText(/All Test Suites Verified & Green/i)).toBeDefined();
    expect(screen.getByText(/All Test Suites Passing/i)).toBeDefined();
  });

  it('renders failure diagnosis and triggers self-heal patch when failures exist', () => {
    const runTestsMock = vi.fn();
    const selfHealMock = vi.fn();
    const mockTests = [
      {
        id: '1',
        testName: 'fails on invalid token',
        testSuite: 'auth.test.ts',
        filePath: 'src/services/auth.ts',
        status: 'failed',
        errorStack: 'AssertionError: expected false to be true',
      },
    ];

    render(
      <AgentQATab
        testResults={mockTests}
        failedTests={1}
        runTests={runTestsMock}
        triggerSelfHealDebug={selfHealMock}
      />
    );

    expect(screen.getByText(/1 Assertion Failure Detected/i)).toBeDefined();
    expect(screen.getByText(/Failure Diagnosis: fails on invalid token/i)).toBeDefined();

    const patchBtn = screen.getByRole('button', { name: /Apply Self-Healing Patch/i });
    fireEvent.click(patchBtn);
    expect(selfHealMock).toHaveBeenCalledWith('AssertionError: expected false to be true');

    const runBtn = screen.getByRole('button', { name: /Run Vitest Suite/i });
    fireEvent.click(runBtn);
    expect(runTestsMock).toHaveBeenCalled();
  });
});
