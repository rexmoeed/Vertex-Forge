import { Command } from '../../../../services/commandRegistry';
import { MenuActionContext } from './menuActionContext';

export function getViewCommands(ctx: MenuActionContext): Command[] {
  const { ide, layout, onOpenCommandPalette, handleCycleTheme, setActiveView } = ctx;

  return [
    {
      id: 'view.commandPalette',
      title: 'Command Palette...',
      category: 'View',
      shortcut: 'Ctrl+P',
      description: 'Search and execute any IDE command',
      execute: () => onOpenCommandPalette?.(),
    },
    {
      id: 'view.togglePrimarySidebar',
      title: 'Toggle Primary Sidebar',
      category: 'View',
      shortcut: 'Ctrl+B',
      description: 'Show or hide the primary sidebar',
      execute: () => layout.togglePrimarySidebar?.(),
    },
    {
      id: 'view.toggleSecondarySidebar',
      title: 'Toggle AI Assistant Panel',
      category: 'View',
      shortcut: 'Ctrl+J',
      description: 'Show or hide AI assistant panel',
      execute: () => layout.toggleSecondarySidebar?.(),
    },
    {
      id: 'view.toggleBottomPanel',
      title: 'Toggle Terminal Dock',
      category: 'View',
      shortcut: 'Ctrl+`',
      description: 'Show or hide bottom dock',
      execute: () => layout.toggleBottomPanel?.(),
    },
    {
      id: 'view.togglePreview',
      title: 'Toggle Live Sandbox Preview',
      category: 'View',
      shortcut: 'Ctrl+Shift+V',
      description: 'Toggle real-time interactive preview',
      execute: () => layout.togglePreview?.(),
    },
    {
      id: 'view.toggleActivityBar',
      title: 'Toggle Activity Bar',
      category: 'View',
      description: 'Show or hide the slim left activity bar',
      execute: () => layout.toggleActivityBar?.(),
    },
    {
      id: 'view.toggleZenMode',
      title: 'Toggle Zen Mode',
      category: 'View',
      shortcut: 'Ctrl+Shift+Z',
      description: 'Maximize editor and hide surrounding panels',
      execute: () => layout.toggleZenMode?.(),
    },
    {
      id: 'view.splitEditorRight',
      title: 'Split Editor Right',
      category: 'View',
      shortcut: 'Ctrl+\\',
      description: 'Split current editor side-by-side',
      execute: () => layout.splitEditor?.('vertical'),
    },
    {
      id: 'view.splitEditorDown',
      title: 'Split Editor Down',
      category: 'View',
      shortcut: 'Ctrl+Alt+\\',
      description: 'Split current editor top-and-bottom',
      execute: () => layout.splitEditor?.('horizontal'),
    },
    {
      id: 'view.resetLayout',
      title: 'Reset Layout to Defaults',
      category: 'View',
      description: 'Restore default workbench dimensions',
      execute: () => layout.resetLayout?.(),
    },
    {
      id: 'view.explorer',
      title: 'Open File Explorer',
      category: 'View',
      shortcut: 'Ctrl+Shift+E',
      description: 'Focus file tree in primary sidebar',
      execute: () => {
        ide.setActiveView?.('editor');
        ide.setActiveSidebarTab?.('explorer');
        layout.focusPanel?.('primarySidebar');
      },
    },
    {
      id: 'view.sourceControl',
      title: 'Open Source Control (Git)',
      category: 'View',
      shortcut: 'Ctrl+Shift+G',
      description: 'Focus git staging and commit panel',
      execute: () => {
        ide.setActiveView?.('editor');
        ide.setActiveSidebarTab?.('git');
        layout.focusPanel?.('primarySidebar');
      },
    },
    {
      id: 'view.tests',
      title: 'Open Test Explorer',
      category: 'View',
      description: 'View Vitest test suites and assertions',
      execute: () => {
        ide.setActiveView?.('editor');
        ide.setActiveSidebarTab?.('tests');
        layout.focusPanel?.('primarySidebar');
      },
    },
    {
      id: 'view.settings',
      title: 'Open Settings & Preferences',
      category: 'View',
      shortcut: 'Ctrl+,',
      description: 'Configure editor, models and studio behavior',
      execute: () => setActiveView?.('settings'),
    },
    {
      id: 'view.switchTheme',
      title: 'Cycle Antigravity Theme',
      category: 'View',
      description: 'Cycle Obsidian, Light, Cyberpunk and Dark tokens',
      execute: () => handleCycleTheme?.(),
    },
  ];
}

export function getGoCommands(ctx: MenuActionContext): Command[] {
  const { ide, layout, onOpenCommandPalette } = ctx;

  return [
    {
      id: 'go.goToFile',
      title: 'Go to File... (Quick Open)',
      category: 'Go',
      shortcut: 'Ctrl+P',
      description: 'Quickly find and open any file by name',
      execute: () => onOpenCommandPalette?.(),
    },
    {
      id: 'go.nextProblem',
      title: 'Next Problem / Diagnostic',
      category: 'Go',
      shortcut: 'F8',
      description: 'Navigate to next code problem or error',
      execute: () => {
        if (ide.problems && ide.problems.length > 0) {
          ide.setActiveSidebarTab?.('problems');
          layout.focusPanel?.('terminal');
        }
      },
    },
    {
      id: 'go.back',
      title: 'Back',
      category: 'Go',
      shortcut: 'Alt+Left',
      description: 'Navigate back in navigation history',
      execute: () => window.history.back(),
    },
    {
      id: 'go.forward',
      title: 'Forward',
      category: 'Go',
      shortcut: 'Alt+Right',
      description: 'Navigate forward in history',
      execute: () => window.history.forward(),
    },
  ];
}
