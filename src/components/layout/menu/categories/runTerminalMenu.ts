import { Command } from '../../../../services/commandRegistry';
import { MenuActionContext } from './menuActionContext';

export function getRunCommands(ctx: MenuActionContext): Command[] {
  const { ide } = ctx;

  return [
    {
      id: 'run.allTests',
      title: 'Run All Tests (Vitest)',
      category: 'Run',
      description: 'Execute workspace test suite',
      execute: () => ide.runTests?.(),
    },
    {
      id: 'run.startDebugging',
      title: 'Start Self-Healing Debugger',
      category: 'Run',
      description: 'Autonomous debugging loop',
      execute: () => ide.triggerSelfHealDebug?.(),
    },
    {
      id: 'run.build',
      title: 'Build Workspace Project',
      category: 'Run',
      description: 'Run project build command in sandboxed environment',
      execute: () => ide.runCommand?.('npm run build'),
    },
    {
      id: 'run.lint',
      title: 'Run Linter',
      category: 'Run',
      description: 'Run workspace type check and linter',
      execute: () => ide.runLint?.(),
    },
  ];
}

export function getTerminalCommands(ctx: MenuActionContext): Command[] {
  const { ide, layout } = ctx;

  return [
    {
      id: 'terminal.new',
      title: 'New Terminal Instance',
      category: 'Terminal',
      shortcut: 'Ctrl+Shift+`',
      description: 'Create a new sandboxed bash/powershell terminal',
      execute: () => {
        layout.focusPanel?.('terminal');
        ide.setBottomPanelTab?.('terminal');
      },
    },
    {
      id: 'terminal.clear',
      title: 'Clear Terminal Output',
      category: 'Terminal',
      shortcut: 'Ctrl+K',
      description: 'Clear current active terminal viewport buffer',
      execute: () => ide.clearTerminal?.(),
    },
    {
      id: 'terminal.focus',
      title: 'Focus Terminal Dock',
      category: 'Terminal',
      shortcut: 'Ctrl+`',
      description: 'Show and focus bottom terminal panel',
      execute: () => {
        layout.focusPanel?.('terminal');
        ide.setBottomPanelTab?.('terminal');
      },
    },
    {
      id: 'terminal.maximize',
      title: 'Maximize / Restore Terminal Dock',
      category: 'Terminal',
      description: 'Toggle full-height bottom terminal panel',
      execute: () => layout.toggleBottomPanelMaximized?.(),
    },
  ];
}
