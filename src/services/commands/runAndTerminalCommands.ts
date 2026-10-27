import { Command } from '../commandRegistry';
import { CommandContext } from './types';

export function createRunAndTerminalCommands(ctx: CommandContext): Command[] {
  const { ide, layout } = ctx;

  return [
    // 6. RUN MENU
    {
      id: 'run.startDapDebug',
      title: 'Start Debugging Session (DAP)',
      category: 'Run',
      shortcut: 'F5',
      description: 'Launch program under multi-language DAP debugger',
      execute: () => ide.debuggerEngine.startSession(),
    },
    {
      id: 'run.stopDapDebug',
      title: 'Stop Debugging Session',
      category: 'Run',
      shortcut: 'Shift+F5',
      description: 'Terminate active debugging session and process',
      isEnabled: () => !!ide.debugSession && ide.debugSession.status !== 'stopped',
      execute: () => ide.debuggerEngine.stopSession(),
    },
    {
      id: 'run.stepOver',
      title: 'Step Over',
      category: 'Run',
      shortcut: 'F10',
      description: 'Advance execution to next statement',
      isEnabled: () => ide.debugThread?.status === 'paused',
      execute: () => ide.debuggerEngine.stepOver(),
    },
    {
      id: 'run.stepInto',
      title: 'Step Into',
      category: 'Run',
      shortcut: 'F11',
      description: 'Step into function call',
      isEnabled: () => ide.debugThread?.status === 'paused',
      execute: () => ide.debuggerEngine.stepInto(),
    },
    {
      id: 'run.stepOut',
      title: 'Step Out',
      category: 'Run',
      shortcut: 'Shift+F11',
      description: 'Step out of current stack frame',
      isEnabled: () => ide.debugThread?.status === 'paused',
      execute: () => ide.debuggerEngine.stepOut(),
    },
    {
      id: 'run.allTests',
      title: 'Run All Tests (Vitest)',
      category: 'Run',
      shortcut: 'Cmd+T',
      description: 'Execute unit test suite against workspace',
      execute: () => ide.runTests(),
    },
    {
      id: 'run.startDebugging',
      title: 'Start Self-Healing Debugger',
      category: 'Run',
      shortcut: 'Cmd+Shift+D',
      description: 'Autonomous debugging loop for failing assertions',
      isEnabled: () => ide.testResults.some((t: any) => t.status === 'failed'),
      execute: () => ide.triggerSelfHealDebug(),
    },
    {
      id: 'run.acceptanceTests',
      title: 'Run 10 Production Acceptance Test Suites',
      category: 'Run',
      description: 'Verify 10 production workflow specifications',
      execute: () => ide.setIsAcceptanceModalOpen(true),
    },
    {
      id: 'run.build',
      title: 'Build Workspace Project',
      category: 'Run',
      description: 'Execute build pipeline (npm run build)',
      execute: () => ide.runCommand('npm run build'),
    },
    {
      id: 'run.lint',
      title: 'Run Linter (TypeScript / ESLint)',
      category: 'Run',
      description: 'Validate code syntax and type errors',
      execute: () => ide.runLint(),
    },

    // 7. TERMINAL MENU
    {
      id: 'terminal.new',
      title: 'New Terminal Instance',
      category: 'Terminal',
      shortcut: 'Ctrl+Shift+`',
      description: 'Spawn a new sandbox PTY terminal session',
      execute: () => {
        layout.focusPanel('terminal');
        ide.setBottomPanelTab('terminal');
        ide.runCommand('echo "Terminal session ready."');
      },
    },
    {
      id: 'terminal.clear',
      title: 'Clear Terminal Output',
      category: 'Terminal',
      shortcut: 'Ctrl+L',
      description: 'Clear terminal scrollback history',
      execute: () => ide.clearTerminal(),
    },
    {
      id: 'terminal.focus',
      title: 'Focus Terminal',
      category: 'Terminal',
      description: 'Bring focus to bottom terminal input',
      execute: () => {
        layout.focusPanel('terminal');
        ide.setBottomPanelTab('terminal');
      },
    },
    {
      id: 'terminal.maximize',
      title: 'Maximize / Restore Terminal Dock',
      category: 'Terminal',
      description: 'Expand bottom panel height to fill workspace',
      execute: () => layout.toggleBottomPanelMaximized(),
    },
  ];
}
