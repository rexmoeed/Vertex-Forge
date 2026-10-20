import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelectorBar } from '../layout/orchestrator/ModelSelectorBar';
import { AutonomousProgressCard } from '../layout/orchestrator/AutonomousProgressCard';
import type { AutonomousPlan, VerificationSummary } from '../../types/autonomousAgent';

describe('Orchestrator Component Layer', () => {
  describe('ModelSelectorBar', () => {
    it('renders current model selection and toggles autonomous mode', () => {
      const setCursorMode = vi.fn();
      const setSelectedModel = vi.fn();
      const setIsModelDropdownOpen = vi.fn();
      const handleSendQuery = vi.fn();

      render(
        <ModelSelectorBar
          cursorMode="agent"
          setCursorMode={setCursorMode}
          selectedModel="gemini-3.8-flash"
          setSelectedModel={setSelectedModel}
          isModelDropdownOpen={false}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          setActiveView={vi.fn()}
          showAtMenu={false}
          setShowAtMenu={vi.fn()}
          chatInput="Refactor database schema"
          isChatLoading={false}
          setIsChatLoading={vi.fn()}
          handleSendQuery={handleSendQuery}
        />
      );

      // Verify active model text
      expect(screen.getByText('Gemini 3.8 Flash')).toBeDefined();

      // Test mode button toggle
      const modeBtn = screen.getByTitle(/Mode: AGENT/i);
      fireEvent.click(modeBtn);
      expect(setCursorMode).toHaveBeenCalledWith('ask');

      // Test send query button
      const sendBtn = screen.getByTitle('Send message');
      fireEvent.click(sendBtn);
      expect(handleSendQuery).toHaveBeenCalled();
    });

    it('opens model dropdown and selects alternate model', () => {
      const setSelectedModel = vi.fn();
      const setIsModelDropdownOpen = vi.fn();

      render(
        <ModelSelectorBar
          cursorMode="ask"
          setCursorMode={vi.fn()}
          selectedModel="claude-3-7-sonnet"
          setSelectedModel={setSelectedModel}
          isModelDropdownOpen={true}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          setActiveView={vi.fn()}
          showAtMenu={false}
          setShowAtMenu={vi.fn()}
          chatInput=""
          isChatLoading={false}
          setIsChatLoading={vi.fn()}
          handleSendQuery={vi.fn()}
        />
      );

      // Verify popover shows Claude and GPT options
      expect(screen.getByText('GPT-4o Omniscient')).toBeDefined();

      // Click DeepSeek R1
      const deepseekOption = screen.getByText('DeepSeek R1');
      fireEvent.click(deepseekOption);
      expect(setSelectedModel).toHaveBeenCalledWith('deepseek-r1');
      expect(setIsModelDropdownOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('AutonomousProgressCard', () => {
    const mockPlan: AutonomousPlan = {
      id: 'plan-123',
      goal: 'Implement structured logging architecture',
      techStackSummary: 'TypeScript/React',
      rootWorkspace: '/app',
      status: 'in_progress',
      tasks: [
        {
          id: 'task-1',
          title: 'Design Logger interface',
          description: 'Define levels and entry schemas',
          role: 'Architect',
          status: 'completed',
          dependencies: [],
          acceptanceCriteria: ['Valid schema'],
          estimatedTools: ['write_file'],
          targetFiles: ['src/services/logger.ts'],
          requiresApproval: false,
          approvalStatus: 'approved',
          retryCount: 0,
          maxRetries: 3,
          executionHistory: [
            {
              id: 'step-1',
              stepIndex: 1,
              tool: 'write_file',
              args: {},
              result: { success: true, durationMs: 24, output: 'ok' },
              rationale: 'Create logger',
              observation: 'Created src/services/logger.ts',
              timestamp: Date.now(),
            },
          ],
        },
        {
          id: 'task-2',
          title: 'Implement unit tests',
          description: 'Assert formatting and cause capture',
          role: 'Developer',
          status: 'running',
          dependencies: ['task-1'],
          acceptanceCriteria: ['Pass assertions'],
          estimatedTools: ['run_tests'],
          targetFiles: ['src/services/__tests__/logger.test.ts'],
          requiresApproval: false,
          approvalStatus: 'approved',
          retryCount: 0,
          maxRetries: 3,
          executionHistory: [],
        },
      ],
      suggestedTools: ['write_file', 'run_tests'],
      estimatedTotalSteps: 4,
      createdAt: Date.now(),
      };

    it('renders plan goal, progress percentage, and tasks state', () => {
      const pauseAutonomousPlan = vi.fn();

      render(
        <AutonomousProgressCard
          autonomousPlan={mockPlan}
          autonomousExecutionState="executing"
          progressPercent={50}
          pauseAutonomousPlan={pauseAutonomousPlan}
          resumeAutonomousPlan={vi.fn()}
          cancelAutonomousPlan={vi.fn()}
          rollbackAutonomousPlan={vi.fn()}
          approveAutonomousPlan={vi.fn()}
          rejectAutonomousPlan={vi.fn()}
          retryAutonomousTask={vi.fn()}
          verificationSummary={null}
        />
      );

      expect(screen.getByText('Implement structured logging architecture')).toBeDefined();
      expect(screen.getByText('50%')).toBeDefined();
      expect(screen.getByText('1. Design Logger interface')).toBeDefined();
      expect(screen.getByText('2. Implement unit tests')).toBeDefined();

      // Click pause
      const pauseBtn = screen.getByTitle('Pause execution loop');
      fireEvent.click(pauseBtn);
      expect(pauseAutonomousPlan).toHaveBeenCalled();
    });

    it('renders verification summary report when verification finishes', () => {
      const summary: VerificationSummary = {
        overallSuccess: true,
        testsPassed: 306,
        testsFailed: 0,
        typeCheckPassed: true,
        checksNotRun: [],
        timestamp: Date.now(),
        filesChanged: ['src/services/logger.ts', 'src/services/__tests__/logger.test.ts'],
        commandsExecuted: [
          { command: 'npm test', exitCode: 0, success: true },
          { command: 'npm run typecheck', exitCode: 0, success: true },
        ],
        remainingRisks: [],
      };

      render(
        <AutonomousProgressCard
          autonomousPlan={mockPlan}
          autonomousExecutionState="completed"
          progressPercent={100}
          pauseAutonomousPlan={vi.fn()}
          resumeAutonomousPlan={vi.fn()}
          cancelAutonomousPlan={vi.fn()}
          rollbackAutonomousPlan={vi.fn()}
          approveAutonomousPlan={vi.fn()}
          rejectAutonomousPlan={vi.fn()}
          retryAutonomousTask={vi.fn()}
          verificationSummary={summary}
        />
      );

      expect(screen.getByText('Verification Report')).toBeDefined();
      expect(screen.getByText('PASSED')).toBeDefined();
      expect(screen.getByText('306 passed')).toBeDefined();
    });
  });
});
