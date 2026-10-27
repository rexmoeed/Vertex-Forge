import { describe, it, expect, vi } from 'vitest';
import { AutonomousPlanGenerator } from '../autonomousPlanGenerator';
import { AutonomousVerificationService } from '../autonomousVerificationService';
import { VirtualFileSystem } from '../../virtualFs';

describe('Autonomous Plan & Verification Modules', () => {
  it('generates autonomous plan with fallback tasks', async () => {
    const vfs = new VirtualFileSystem([]);
    const toolRegistry: any = {
      executeTool: vi.fn().mockResolvedValue({ success: false }),
    };

    const plan = await AutonomousPlanGenerator.planGoal(
      'Build shopping cart component',
      vfs,
      toolRegistry,
      'autonomous',
      3
    );

    expect(plan.goal).toBe('Build shopping cart component');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(2);
    expect(plan.status).toBe('draft');
  });

  it('runs verification suite via AutonomousVerificationService', async () => {
    const toolRegistry: any = {
      executeTool: vi.fn().mockImplementation((name: string) => {
        if (name === 'type_check') return Promise.resolve({ success: true });
        if (name === 'run_tests') return Promise.resolve({ success: true, data: { passed: 10, failed: 0 } });
        return Promise.resolve({ success: true });
      }),
    };

    const filesModified = new Set(['src/Cart.tsx', 'src/__tests__/Cart.test.tsx']);
    const commandsExecuted: any[] = [];

    const summary = await AutonomousVerificationService.runVerification(
      toolRegistry,
      filesModified,
      commandsExecuted
    );

    expect(summary.overallSuccess).toBe(true);
    expect(summary.filesChanged).toContain('src/Cart.tsx');
    expect(summary.testsPassed).toBe(10);
    expect(summary.typeCheckPassed).toBe(true);
  });
});
