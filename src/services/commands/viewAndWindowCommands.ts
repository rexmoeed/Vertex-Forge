import { Command } from '../commandRegistry';
import { CommandContext } from './types';

export function createViewAndWindowCommands(ctx: CommandContext): Command[] {
  const { ide, layout, onOpenCommandPalette } = ctx;

  return [
    // 4. VIEW MENU & LAYOUT COMMANDS
    {
      id: 'view.commandPalette',
      title: 'Command Palette...',
      category: 'View',
      shortcut: 'Cmd+K',
      description: 'Search and execute any IDE command',
      execute: () => onOpenCommandPalette(),
    },
    {
      id: 'view.togglePrimarySidebar',
      title: 'Toggle Primary Sidebar',
      category: 'View',
      shortcut: 'Cmd+B',
      description: 'Show or hide the primary left/right sidebar',
      execute: () => layout.togglePrimarySidebar(),
    },
    {
      id: 'view.toggleSecondarySidebar',
      title: 'Toggle AI Assistant Panel',
      category: 'View',
      shortcut: 'Cmd+Alt+B',
      description: 'Show or hide the secondary AI assistant panel',
      execute: () => layout.toggleSecondarySidebar(),
    },
    {
      id: 'view.toggleBottomPanel',
      title: 'Toggle Bottom Panel (Terminal / Problems)',
      category: 'View',
      shortcut: 'Cmd+`',
      description: 'Show or hide bottom terminal dock',
      execute: () => layout.toggleBottomPanel(),
    },
    {
      id: 'view.togglePreview',
      title: 'Toggle Live Sandbox Preview',
      category: 'View',
      shortcut: 'Cmd+Shift+V',
      description: 'Toggle real-time interactive preview viewport',
      execute: () => layout.togglePreview(),
    },
    {
      id: 'view.toggleActivityBar',
      title: 'Toggle Activity Bar',
      category: 'View',
      description: 'Show or hide the slim left activity bar',
      execute: () => layout.toggleActivityBar(),
    },
    {
      id: 'view.toggleZenMode',
      title: 'Toggle Zen / Distraction-Free Mode',
      category: 'View',
      shortcut: 'Cmd+Shift+Z',
      description: 'Maximize editor and hide all surrounding panels',
      execute: () => layout.toggleZenMode(),
    },
    {
      id: 'view.splitEditorRight',
      title: 'Split Editor Right (Vertical Split)',
      category: 'View',
      shortcut: 'Cmd+\\',
      description: 'Split current editor side-by-side into two groups',
      execute: () => layout.splitEditor('vertical'),
    },
    {
      id: 'view.splitEditorDown',
      title: 'Split Editor Down (Horizontal Split)',
      category: 'View',
      description: 'Split current editor top-and-bottom into two groups',
      execute: () => layout.splitEditor('horizontal'),
    },
    {
      id: 'view.closeEditorSplit',
      title: 'Close Editor Split',
      category: 'View',
      description: 'Recombine split editor groups back to single view',
      execute: () => layout.closeEditorSplit(),
    },

    // Layout Presets
    {
      id: 'view.presetDefault',
      title: 'Apply Layout Preset: Default',
      category: 'View',
      description: 'Standard coding layout with explorer, editor & AI',
      execute: () => layout.applyPreset('default'),
    },
    {
      id: 'view.presetAIDev',
      title: 'Apply Layout Preset: AI Development',
      category: 'View',
      description: 'Expands AI assistant and agent activity feeds',
      execute: () => layout.applyPreset('ai-dev'),
    },
    {
      id: 'view.presetDesign',
      title: 'Apply Layout Preset: Design Studio',
      category: 'View',
      description: 'Side-by-side editor and live responsive preview',
      execute: () => layout.applyPreset('design'),
    },
    {
      id: 'view.presetFullstack',
      title: 'Apply Layout Preset: Full-Stack',
      category: 'View',
      description: 'Dual editor with tall terminal dock for backend & API logs',
      execute: () => layout.applyPreset('fullstack'),
    },
    {
      id: 'view.presetDebug',
      title: 'Apply Layout Preset: Debugging',
      category: 'View',
      description: 'Expands diagnostics, problems panel & test runner',
      execute: () => layout.applyPreset('debug'),
    },
    {
      id: 'view.resetLayout',
      title: 'Reset Window Layout to Defaults',
      category: 'View',
      description: 'Restore factory dimensions and visibility settings',
      execute: () => layout.resetLayout(),
    },

    // Destination Views
    {
      id: 'view.explorer',
      title: 'Open File Explorer',
      category: 'View',
      shortcut: 'Cmd+Shift+E',
      description: 'Focus file tree navigator in primary sidebar',
      execute: () => {
        ide.setActiveView('editor');
        ide.setActiveSidebarTab('explorer');
        layout.focusPanel('primarySidebar');
      },
    },
    {
      id: 'view.sourceControl',
      title: 'Open Source Control (Git)',
      category: 'View',
      shortcut: 'Cmd+Shift+G',
      description: 'Focus git staging and commit panel',
      execute: () => {
        ide.setActiveView('editor');
        ide.setActiveSidebarTab('git');
        layout.focusPanel('primarySidebar');
      },
    },
    {
      id: 'view.tests',
      title: 'Open Test Explorer',
      category: 'View',
      description: 'View Vitest test suites and assertions',
      execute: () => {
        ide.setActiveView('editor');
        ide.setActiveSidebarTab('tests');
        layout.focusPanel('primarySidebar');
      },
    },
    {
      id: 'view.extensions',
      title: 'Open Extensions & Plugins Marketplace',
      category: 'View',
      shortcut: 'Cmd+Shift+X',
      description: 'Browse, install, and manage IDE extensions and MCP plugins',
      execute: () => {
        ide.setActiveView('editor');
        ide.setActiveSidebarTab('extensions');
        layout.focusPanel('primarySidebar');
      },
    },
    {
      id: 'view.evolution',
      title: 'Open Code Evolution Map',
      category: 'View',
      description: 'Inspect repository velocity, git history, and hotspots',
      execute: () => ide.setActiveView('evolution'),
    },
    {
      id: 'view.bugDetective',
      title: 'Open Bug Detective Diagnostic Engine',
      category: 'View',
      description: 'Cross-layer diagnostic analysis across UI, network, and backend',
      execute: () => ide.setActiveView('bug-detective'),
    },
    {
      id: 'view.watchdog',
      title: 'Open Production Watchdog Observability',
      category: 'View',
      description: 'Live incident telemetry and fingerprint grouping',
      execute: () => ide.setActiveView('watchdog'),
    },
    {
      id: 'view.agentTeam',
      title: 'Open Hierarchical AI Team Workspace (10 Leads)',
      category: 'View',
      description: 'Deep-dive into 10 specialist agent leads and sub-agent contracts',
      execute: () => ide.setActiveView('agents'),
    },
    {
      id: 'view.designSystem',
      title: 'Open Design System & Tokens Studio',
      category: 'View',
      description: 'Inspect design tokens, typography, and component states',
      execute: () => ide.setActiveView('design-system'),
    },
    {
      id: 'view.settings',
      title: 'Open Settings & Preferences',
      category: 'View',
      shortcut: 'Cmd+,',
      description: 'Configure appearance, AI model, and security sandbox',
      execute: () => ide.setActiveView('settings'),
    },
    {
      id: 'view.aiProviders',
      title: 'Open AI Provider Hub (BYOK)',
      category: 'View',
      description: 'Manage API keys and models for OpenAI, Claude, Gemini & Local',
      execute: () => ide.setActiveView('providers'),
    },
    {
      id: 'view.switchTheme',
      title: 'Switch Antigravity Theme (Cycle)',
      category: 'View',
      shortcut: 'Cmd+K Cmd+T',
      description: 'Cycle through Antigravity Cyber, Obsidian, Nebula, Solar, Titanium, and official IDE themes',
      execute: () => ide.toggleTheme(),
    },

    // 5. GO MENU
    {
      id: 'go.goToFile',
      title: 'Go to File... (Quick Open)',
      category: 'Go',
      shortcut: 'Cmd+P',
      description: 'Quickly find and open any file in workspace',
      execute: () => onOpenCommandPalette(),
    },
    {
      id: 'go.nextProblem',
      title: 'Next Problem / Diagnostic',
      category: 'Go',
      shortcut: 'F8',
      description: 'Navigate to next code error or warning',
      isEnabled: () => ide.problems.length > 0,
      execute: () => {
        layout.focusPanel('terminal');
        ide.setBottomPanelTab('problems');
      },
    },

    // 11. WINDOW MENU
    {
      id: 'window.focusEditor',
      title: 'Focus Main Editor',
      category: 'Window',
      shortcut: 'Cmd+1',
      description: 'Set focus to the central code editor',
      execute: () => {
        ide.setActiveView('editor');
        layout.focusPanel('editor');
      },
    },
    {
      id: 'window.focusAI',
      title: 'Focus AI Assistant',
      category: 'Window',
      shortcut: 'Cmd+2',
      description: 'Set focus to the AI chat and orchestrator panel',
      execute: () => {
        layout.focusPanel('ai');
      },
    },
    {
      id: 'window.focusTerminal',
      title: 'Focus Terminal Dock',
      category: 'Window',
      shortcut: 'Cmd+3',
      description: 'Set focus to the integrated terminal',
      execute: () => {
        layout.focusPanel('terminal');
        ide.setBottomPanelTab('terminal');
      },
    },
    {
      id: 'window.focusExplorer',
      title: 'Focus Explorer Sidebar',
      category: 'Window',
      shortcut: 'Cmd+0',
      description: 'Set focus to primary sidebar file explorer',
      execute: () => {
        ide.setActiveView('editor');
        ide.setActiveSidebarTab('explorer');
        layout.focusPanel('primarySidebar');
      },
    },
  ];
}
