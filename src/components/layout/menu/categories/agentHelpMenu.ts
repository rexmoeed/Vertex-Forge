import { Command } from '../../../../services/commandRegistry';
import { MenuActionContext } from './menuActionContext';

export function getAgentCommands(ctx: MenuActionContext): Command[] {
  const { ide, onOpenJulesMission, onOpenComposer, onOpenCursorRules, setActiveView } = ctx;

  return [
    {
      id: 'ai.julesMission',
      title: 'Google Jules: Launch Cloud Agent Mission...',
      category: 'Agent / AI',
      description: 'Delegate autonomous coding tasks to Google Jules in cloud VM',
      execute: () => onOpenJulesMission?.(),
    },
    {
      id: 'ai.composer',
      title: 'Open Cursor Composer (Multi-File Agent)',
      category: 'Agent / AI',
      shortcut: 'Ctrl+I',
      description: 'Multi-file AI editor and architecture agent',
      execute: () => onOpenComposer?.(),
    },
    {
      id: 'ai.cursorrules',
      title: 'Manage Project AI Rules (.cursorrules)',
      category: 'Agent / AI',
      description: 'Configure workspace instructions and steering guidelines',
      execute: () => onOpenCursorRules?.(),
    },
    {
      id: 'ai.modeAgent',
      title: 'Switch to Autonomous Agent Mode',
      category: 'Agent / AI',
      description: 'Autonomous multi-file editing and test self-healing',
      execute: () => ide.setCursorMode?.('agent'),
    },
    {
      id: 'ai.modeEdit',
      title: 'Switch to Edit Mode',
      category: 'Agent / AI',
      description: 'Inline diff generation and fast refactoring',
      execute: () => ide.setCursorMode?.('edit'),
    },
    {
      id: 'ai.modeAsk',
      title: 'Switch to Ask Mode',
      category: 'Agent / AI',
      description: 'Read-only context-aware code explanation',
      execute: () => ide.setCursorMode?.('ask'),
    },
    {
      id: 'ai.selfHealBug',
      title: 'Autonomous Self-Heal Failing Tests',
      category: 'Agent / AI',
      description: 'Diagnose failing tests and apply verified code repairs',
      execute: () => ide.triggerSelfHealDebug?.(),
    },
    {
      id: 'ai.openProviderHub',
      title: 'Open AI Provider Hub (BYOK Keys)',
      category: 'Agent / AI',
      description: 'Configure Gemini, Claude, OpenAI and DeepSeek keys',
      execute: () => setActiveView?.('providers'),
    },
    {
      id: 'ai.reviewSecurity',
      title: 'Run AI Security & Dependency Audit',
      category: 'Agent / AI',
      description: 'Scan workspace for CVE vulnerabilities and unsafe secrets',
      execute: () => ide.runSecurityReview?.(),
    },
  ];
}

export function getHelpCommands(ctx: MenuActionContext): Command[] {
  const { onOpenShortcuts } = ctx;

  return [
    {
      id: 'help.tour',
      title: 'Feature Tour & Walkthrough',
      category: 'Help',
      description: 'Interactive introduction to Vertex Forge features',
      execute: () => window.dispatchEvent(new CustomEvent('vertex:open-walkthrough')),
    },
    {
      id: 'help.shortcuts',
      title: 'Keyboard Shortcuts Cheat Sheet',
      category: 'Help',
      shortcut: 'Ctrl+/',
      description: 'View all keyboard shortcuts and triggers',
      execute: () => onOpenShortcuts?.(),
    },
    {
      id: 'help.updates',
      title: 'Check for Updates...',
      category: 'Help',
      description: 'Check GitHub releases for updates',
      execute: () => alert('Vertex Forge is up to date (v1.0.0).'),
    },
    {
      id: 'help.about',
      title: 'About Vertex Forge Desktop',
      category: 'Help',
      description: 'Autonomous AI Software Engineering Studio',
      execute: () =>
        alert(
          'Vertex Forge v1.0.0\nAutonomous AI Software Engineering Studio\nElectron + React 19 + TypeScript + Monaco Editor + Multi-Agent Parallel Swarms'
        ),
    },
  ];
}
