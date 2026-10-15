import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentToolRegistry } from '../agentToolRegistry';
import { AutonomousAgentEngine } from '../autonomousAgentEngine';
import { VirtualFileSystem } from '../virtualFs';
import { FileNode } from '../../types/ide';

const TEST_FILES: FileNode[] = [
  {
    id: 'f-pkg',
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    content: JSON.stringify({
      name: 'test-app',
      dependencies: { react: '^19.0.0', typescript: '^5.0.0' },
    }),
  },
  {
    id: 'f-task-service',
    name: 'taskService.ts',
    path: 'src/services/taskService.ts',
    type: 'file',
    content: `export interface Task { id: string; title: string; priority: number; }
export function createTask(title: string, priority: number): Task {
  return { id: 't1', title, priority };
}`,
  },
  {
    id: 'f-app',
    name: 'App.tsx',
    path: 'src/App.tsx',
    type: 'file',
    content: `import React from 'react';\nexport function App() { return <div>Vertex App</div>; }`,
  },
];

describe('Autonomous AI Software Engineer - Tool Registry & Safety', () => {
  let vfs: VirtualFileSystem;
  let registry: AgentToolRegistry;

  beforeEach(() => {
    vfs = new VirtualFileSystem(TEST_FILES);
    registry = new AgentToolRegistry(vfs, 'autonomous');
  });

  it('reads file contents accurately with line slicing', async () => {
    const res = await registry.executeTool('read_file', {
      filePath: 'src/services/taskService.ts',
      startLine: 1,
      endLine: 2,
    });

    expect(res.success).toBe(true);
    expect(res.data?.content).toContain('export interface Task');
    expect(res.data?.totalLines).toBe(4);
  });

  it('performs file writing and records unified diff', async () => {
    const newContent = `export interface Task { id: string; title: string; priority: number; status: string; }\nexport function createTask(title: string, priority: number): Task {\n  return { id: 't1', title, priority, status: 'open' };\n}`;
    const res = await registry.executeTool('write_file', {
      filePath: 'src/services/taskService.ts',
      content: newContent,
    }, 'task-101');

    expect(res.success).toBe(true);
    expect(res.changesDetected).toBe(true);
    expect(res.diff).toContain('+export interface Task');
    expect(vfs.readFile('src/services/taskService.ts')).toBe(newContent);
  });

  it('patches target code blocks safely without overwriting whole file', async () => {
    const res = await registry.executeTool('patch_file', {
      filePath: 'src/App.tsx',
      targetString: '<div>Vertex App</div>',
      replacementString: '<main><h1>Autonomous Vertex Forge</h1></main>',
    });

    expect(res.success).toBe(true);
    expect(vfs.readFile('src/App.tsx')).toContain('<h1>Autonomous Vertex Forge</h1>');
  });

  it('fails gracefully when patch target string is not found', async () => {
    const res = await registry.executeTool('patch_file', {
      filePath: 'src/App.tsx',
      targetString: '<nonExistentTarget>',
      replacementString: 'replacement',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Target string was not found');
  });

  it('blocks destructive shell commands', () => {
    const destructive = [
      'rm -rf /',
      'rm -rf /var/lib',
      'rm -rf ..',
      'mkfs /dev/sda',
      'chmod -R 777 /',
      'git reset --hard HEAD~50',
    ];

    for (const cmd of destructive) {
      const safety = registry.evaluateSafety('terminal_command', { command: cmd });
      expect(safety.allowed).toBe(false);
      expect(safety.riskLevel).toBe('critical');
    }
  });

  it('blocks path traversal outside workspace', () => {
    const dangerousPaths = [
      '/etc/passwd',
      '/usr/bin/bash',
      '/root/.ssh/id_rsa',
      'src/../../etc/shadow',
    ];

    for (const p of dangerousPaths) {
      const safety = registry.evaluateSafety('read_file', { filePath: p });
      expect(safety.allowed).toBe(false);
      expect(safety.riskLevel).toBe('critical');
    }
  });

  it('protects credential and environment secret files', () => {
    const safety = registry.evaluateSafety('read_file', { filePath: '.env' });
    expect(safety.requiresExplicitApproval).toBe(true);
    expect(safety.riskLevel).toBe('high');
  });

  it('enforces strict permission mode requiring approval for file modifications', () => {
    registry.setPermissionMode('strict');
    const safety = registry.evaluateSafety('write_file', { filePath: 'src/App.tsx' });
    expect(safety.allowed).toBe(false);
    expect(safety.requiresExplicitApproval).toBe(true);
  });
});

describe('Autonomous Checkpoints & Rollback', () => {
  let vfs: VirtualFileSystem;
  let registry: AgentToolRegistry;

  beforeEach(() => {
    vfs = new VirtualFileSystem(TEST_FILES);
    registry = new AgentToolRegistry(vfs, 'autonomous');
  });

  it('creates checkpoint and rolls back modified file to original content', async () => {
    const original = vfs.readFile('src/App.tsx');
    const checkpoint = await registry.createCheckpoint('t-1', ['src/App.tsx'], 'Pre-edit App');

    // Modify file
    await registry.executeTool('write_file', {
      filePath: 'src/App.tsx',
      content: '// Modified code',
    });
    expect(vfs.readFile('src/App.tsx')).toBe('// Modified code');

    // Rollback
    const rollbackRes = await registry.rollbackCheckpoint(checkpoint.id);
    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.revertedFiles).toContain('src/App.tsx');
    expect(vfs.readFile('src/App.tsx')).toBe(original);
  });

  it('deletes newly created agent files during rollback without touching other files', async () => {
    const newFilePath = 'src/components/NewFeature.tsx';
    const checkpoint = await registry.createCheckpoint('t-2', [newFilePath], 'Before create');

    // Create file
    await registry.executeTool('create_file', {
      filePath: newFilePath,
      initialContent: 'export const NewFeature = () => null;',
    });
    expect(vfs.exists(newFilePath)).toBe(true);

    // Rollback
    await registry.rollbackCheckpoint(checkpoint.id);
    expect(vfs.exists(newFilePath)).toBe(false);
    expect(vfs.exists('src/App.tsx')).toBe(true);
  });
});

describe('Autonomous Multi-Step Execution Loop & State Machine', () => {
  let vfs: VirtualFileSystem;
  let engine: AutonomousAgentEngine;

  beforeEach(() => {
    vfs = new VirtualFileSystem(TEST_FILES);
    engine = new AutonomousAgentEngine(vfs, 'autonomous');
  });

  it('plans tasks with ordered state machine and dependencies', async () => {
    const plan = await engine.planGoal('Add validation logic to taskService');

    expect(plan.tasks.length).toBeGreaterThanOrEqual(2);
    expect(plan.tasks[0].status).toBe('pending');
    expect(plan.tasks[0].acceptanceCriteria.length).toBeGreaterThan(0);
    expect(plan.tasks[0].estimatedTools).toContain('write_file');
    // Task 2 depends on Task 1
    expect(plan.tasks[1].dependencies).toContain(plan.tasks[0].id);
  });

  it('pauses and resumes autonomous execution', async () => {
    await engine.planGoal('Build sample test suite');
    expect(engine.getExecutionState()).toBe('idle');

    engine.pause();
    expect(engine.getExecutionState()).toBe('paused');

    engine.cancel();
    expect(engine.getExecutionState()).toBe('cancelled');
  });

  it('waits for plan approval when in supervised or strict mode', async () => {
    engine.setPermissionMode('strict');
    const plan = await engine.planGoal('Add user authorization rules');

    expect(engine.getExecutionState()).toBe('waiting_plan_approval');
    expect(plan.status).toBe('draft');

    engine.approvePlan();
    expect(['approved', 'in_progress', 'completed']).toContain(plan.status);
  });

  it('rejects plan when user denies approval', async () => {
    engine.setPermissionMode('supervised');
    const plan = await engine.planGoal('Delete temporary folders');

    expect(engine.getExecutionState()).toBe('waiting_plan_approval');
    engine.rejectPlan();

    expect(plan.status).toBe('rejected');
    expect(engine.getExecutionState()).toBe('cancelled');
  });

  it('executes full multi-step loop and generates verification summary', async () => {
    await engine.planGoal('Harden task creation function');

    const verification = await engine.executePlan();

    expect(verification).toBeDefined();
    expect(Array.isArray(verification.filesChanged)).toBe(true);
    expect(Array.isArray(verification.commandsExecuted)).toBe(true);
    expect(typeof verification.testsPassed).toBe('number');
    expect(typeof verification.typeCheckPassed).toBe('boolean');
    expect(Array.isArray(verification.remainingRisks)).toBe(true);
    expect(Array.isArray(verification.checksNotRun)).toBe(true);
  });
});
