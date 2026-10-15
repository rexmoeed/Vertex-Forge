import { useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { useLayout } from '../context/LayoutContext';
import { CommandRegistry, Command } from '../services/commandRegistry';

interface CommandInitializerProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onOpenNewProject: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
}

export function useCommandInitializer({
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenNewProject,
  onOpenComposer,
  onOpenCursorRules,
}: CommandInitializerProps) {
  const ide = useIDE() as any;
  const layout = useLayout();

  useEffect(() => {
    const commands: Command[] = [
      // 1. FILE MENU
      {
        id: 'file.newFile',
        title: 'New File',
        category: 'File',
        shortcut: 'Cmd+N',
        description: 'Create a new file in workspace',
        execute: () => {
          const name = prompt('Enter new file path (e.g. src/utils/helpers.ts):');
          if (name) ide.createFileOrFolder(name, 'file', '');
        },
      },
      {
        id: 'file.newFolder',
        title: 'New Folder',
        category: 'File',
        description: 'Create a new directory in workspace',
        execute: () => {
          const name = prompt('Enter new folder path (e.g. src/components/ui):');
          if (name) ide.createFileOrFolder(name, 'folder');
        },
      },
      {
        id: 'file.newProject',
        title: 'New Project with AI Architect...',
        category: 'File',
        shortcut: 'Cmd+Shift+N',
        description: 'Scaffold a new project from natural language prompt',
        execute: () => onOpenNewProject(),
      },
      {
        id: 'file.openProject',
        title: 'Open Project / Folder...',
        category: 'File',
        shortcut: 'Cmd+O',
        description: 'Open an existing real project folder from disk',
        execute: () => ide.openLocalFolder(),
      },
      {
        id: 'file.cloneRepo',
        title: 'Clone Git Repository...',
        category: 'File',
        description: 'Clone a remote repository and initialize workspace',
        execute: () => ide.setIsCloneModalOpen(true),
      },
      {
        id: 'file.save',
        title: 'Save File',
        category: 'File',
        shortcut: 'Cmd+S',
        description: 'Save current active file changes',
        isEnabled: () => !!ide.activeFile,
        execute: () => ide.saveCurrentFile(),
      },
      {
        id: 'file.saveAll',
        title: 'Save All Files',
        category: 'File',
        shortcut: 'Cmd+Alt+S',
        description: 'Save all modified workspace files',
        execute: () => ide.saveAllFiles(),
      },
      {
        id: 'file.closeFile',
        title: 'Close Active Editor Tab',
        category: 'File',
        shortcut: 'Cmd+W',
        description: 'Close the current active file tab',
        isEnabled: () => !!ide.activeTabId,
        execute: () => {
          if (ide.activeTabId) ide.closeTab(ide.activeTabId);
        },
      },
      {
        id: 'file.closeProject',
        title: 'Close Project',
        category: 'File',
        shortcut: 'Cmd+Shift+W',
        description: 'Safely close project workspace and return to Welcome screen',
        execute: () => ide.closeProject(),
      },
      {
        id: 'file.revertFile',
        title: 'Revert File Changes',
        category: 'File',
        description: 'Discard uncommitted changes in active file',
        isEnabled: () => !!ide.activeFile,
        execute: () => {
          if (ide.activeFile) ide.revertFile(ide.activeFile);
        },
      },

      // 2. EDIT MENU
      {
        id: 'edit.undo',
        title: 'Undo',
        category: 'Edit',
        shortcut: 'Cmd+Z',
        description: 'Undo last edit in editor',
        execute: () => document.execCommand('undo'),
      },
      {
        id: 'edit.redo',
        title: 'Redo',
        category: 'Edit',
        shortcut: 'Cmd+Shift+Z',
        description: 'Redo last undone edit',
        execute: () => document.execCommand('redo'),
      },
      {
        id: 'edit.selectAll',
        title: 'Select All',
        category: 'Edit',
        shortcut: 'Cmd+A',
        description: 'Select all text in focused editor',
        execute: () => document.execCommand('selectAll'),
      },
      {
        id: 'edit.findInFiles',
        title: 'Find in Files',
        category: 'Edit',
        shortcut: 'Cmd+Shift+F',
        description: 'Search across workspace codebase',
        execute: () => {
          ide.setActiveView('editor');
          ide.setActiveSidebarTab('search');
          layout.focusPanel('primarySidebar');
        },
      },

      // 3. SELECTION MENU
      {
        id: 'selection.duplicateLine',
        title: 'Duplicate Line Down',
        category: 'Selection',
        shortcut: 'Shift+Alt+Down',
        description: 'Duplicate current line or selection',
        execute: () => {
          if (ide.activeFileContent) {
            ide.updateFileContent(ide.activeFileContent + '\n' + ide.activeFileContent.split('\n').slice(-1)[0]);
          }
        },
      },

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

      // 12. HELP MENU
      {
        id: 'help.tour',
        title: 'Feature Tour & Architecture Overview',
        category: 'Help',
        description: 'First-time user walkthrough of panels, workflows, and shortcuts',
        execute: () => {
          window.dispatchEvent(new CustomEvent('nova:open-walkthrough'));
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

    CommandRegistry.registerMany(commands);
  }, [ide, layout, onOpenCommandPalette, onOpenShortcuts, onOpenNewProject]);
}
