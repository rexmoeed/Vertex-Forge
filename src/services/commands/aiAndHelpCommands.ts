import { Command } from '../commandRegistry';
import { CommandContext } from './types';

export function createAiAndHelpCommands(ctx: CommandContext): Command[] {
  const { ide, layout, onOpenComposer, onOpenCursorRules, onOpenShortcuts } = ctx;

  return [
    // 8. AGENT / AI MENU
    {
      id: 'ai.composer',
      title: 'Open Cursor Composer (Multi-File Agent)',
      category: 'Agent / AI',
      shortcut: 'Cmd+I',
      description: 'Generate, refactor, and review multi-file changes with @ context mentions',
      execute: () => onOpenComposer?.(),
    },
    {
      id: 'ai.cursorrules',
      title: 'Manage Project AI Rules (.cursorrules)',
      category: 'Agent / AI',
      description: 'Configure persistent architecture standards and style rules for AI',
      execute: () => onOpenCursorRules?.(),
    },
    {
      id: 'ai.newChat',
      title: 'New AI Conversation',
      category: 'Agent / AI',
      shortcut: 'Cmd+L',
      description: 'Start a fresh prompt with context in AI panel',
      execute: () => {
        layout.focusPanel('ai');
      },
    },
    {
      id: 'ai.modeAsk',
      title: 'Switch to Ask Mode (Read-Only Q&A)',
      category: 'Agent / AI',
      description: 'Ask questions and inspect codebase without modifying files',
      execute: () => ide.setCursorMode('ask'),
    },
    {
      id: 'ai.modeEdit',
      title: 'Switch to Edit Mode (Multi-File Diff Review)',
      category: 'Agent / AI',
      description: 'Propose cross-file changes with side-by-side diff review',
      execute: () => ide.setCursorMode('edit'),
    },
    {
      id: 'ai.modeAgent',
      title: 'Switch to Autonomous Agent Mode',
      category: 'Agent / AI',
      description: 'Autonomous multi-step planner, tool runner & self-healing debugger',
      execute: () => ide.setCursorMode('agent'),
    },
    {
      id: 'ai.selfHealBug',
      title: 'Autonomous Self-Heal Failing Tests',
      category: 'Agent / AI',
      description: 'Diagnose root cause and apply auto-fix patch to failing tests',
      execute: () => ide.triggerSelfHealDebug(),
    },
    {
      id: 'ai.runFullTeamBenchmark',
      title: 'Run Hierarchical AI Team Benchmark',
      category: 'Agent / AI',
      description: 'Execute multi-agent delegation across 10 specialized leads',
      execute: () => {
        ide.setActiveView('agents');
      },
    },
    {
      id: 'ai.openProviderHub',
      title: 'Open AI Provider Hub (BYOK Keys)',
      category: 'Agent / AI',
      shortcut: 'Cmd+Shift+P',
      description: 'Connect personal API keys for Claude, OpenAI, Gemini & Local models',
      execute: () => ide.setActiveView('providers'),
    },
    {
      id: 'ai.configureModels',
      title: 'Configure Agent Model Assignments',
      category: 'Agent / AI',
      description: 'Assign specialized LLM models per engineering agent role',
      execute: () => ide.setActiveView('providers'),
    },
    {
      id: 'ai.reviewSecurity',
      title: 'Run AI Security & Dependency Audit',
      category: 'Agent / AI',
      description: 'Scan code for vulnerabilities and policy compliance',
      execute: () => ide.runSecurityReview(),
    },

    // 9. PROJECT MENU
    {
      id: 'project.intelligence',
      title: 'Project Intelligence & Context Inspector',
      category: 'Project',
      shortcut: 'Cmd+Shift+I',
      description: 'Inspect verified project architecture, frameworks, and LLM reasoning context',
      execute: () => ide.setIsProjectIntelligenceOpen(true),
    },
    {
      id: 'project.controlPanel',
      title: 'Toggle Project Control Panel',
      category: 'Project',
      description: 'Inspect workspace metrics, dependencies, and health',
      execute: () => ide.setIsControlPanelOpen(!ide.isControlPanelOpen),
    },
    {
      id: 'project.architecture',
      title: 'View System Architecture & API Blueprint',
      category: 'Project',
      description: 'Inspect system decomposition, data flow & contracts',
      execute: () => ide.setActiveView('agents'),
    },

    // 10. SOURCE CONTROL MENU
    {
      id: 'git.viewDiff',
      title: 'Review Staged Diffs Modal',
      category: 'Source Control',
      description: 'Inspect multi-file diff comparison',
      isEnabled: () => ide.modifiedFiles.length > 0,
      execute: () => ide.setIsMultiFileReviewOpen(true),
    },
    {
      id: 'git.commit',
      title: 'Commit Staged Changes',
      category: 'Source Control',
      shortcut: 'Cmd+Enter',
      description: 'Create a new Git commit on active branch',
      isEnabled: () => ide.modifiedFiles.length > 0,
      execute: () => {
        const msg = prompt('Enter commit message:', 'feat: update workspace components');
        if (msg) ide.commitChanges(msg);
      },
    },

    // 12. HELP MENU
    {
      id: 'help.tour',
      title: 'Feature Tour & Architecture Overview',
      category: 'Help',
      description: 'First-time user walkthrough of panels, workflows, and shortcuts',
      execute: () => {
        window.dispatchEvent(new CustomEvent('vertex:open-walkthrough'));
      },
    },
    {
      id: 'help.shortcuts',
      title: 'Keyboard Shortcuts Cheat Sheet',
      category: 'Help',
      shortcut: 'Cmd+/',
      description: 'View all keyboard shortcuts and triggers',
      execute: () => onOpenShortcuts(),
    },
    {
      id: 'help.updates',
      title: 'Check for Updates...',
      category: 'Help',
      description: 'Check GitHub Releases for new Vertex Forge updates',
      execute: async () => {
        if (window.desktopAPI?.checkForUpdates) {
          const res = await window.desktopAPI.checkForUpdates();
          if (res.status === 'dev-mode') {
            alert('Running in dev mode. Auto-updates apply to production packaged builds.');
          } else if (res.status === 'success') {
            alert('Update check complete. Running latest version or downloading update.');
          } else {
            alert('Update status: ' + (res.message || 'Vertex Forge is up to date.'));
          }
        } else {
          alert('Desktop updater active in Electron desktop application.');
        }
      },
    },
    {
      id: 'help.about',
      title: 'About Vertex Forge Desktop',
      category: 'Help',
      description: 'Version and environment architecture details',
      execute: () => {
        alert('Vertex Forge v1.0.0\nAutonomous AI Software Engineering Studio\nElectron + React 19 + TypeScript + Monaco Editor + Multi-Agent Parallel Swarms');
      },
    },
  ];
}
