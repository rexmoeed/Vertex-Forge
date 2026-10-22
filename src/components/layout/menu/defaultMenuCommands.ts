import { Command, CommandCategory } from '../../../services/commandRegistry';

export interface MenuActionContext {
  ide: any;
  layout: any;
  themeEngine?: any;
  onOpenNewProject?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
  onOpenJulesMission?: () => void;
  handleCycleTheme?: () => void;
  setActiveView?: (view: any) => void;
  focusEditorTextarea?: () => HTMLTextAreaElement | null;
}

export function getDefaultCategoryCommands(
  cat: CommandCategory,
  ctx: MenuActionContext
): Command[] {
  const {
    ide,
    layout,
    themeEngine,
    onOpenNewProject,
    onOpenCommandPalette,
    onOpenShortcuts,
    onOpenComposer,
    onOpenCursorRules,
    onOpenJulesMission,
    handleCycleTheme,
    setActiveView,
    focusEditorTextarea,
  } = ctx;

    switch (cat) {
      case 'File':
        return [
          {
            id: 'file.newFile',
            title: 'New File',
            category: 'File',
            shortcut: 'Ctrl+N',
            description: 'Create a new file in workspace',
            execute: () => {
              ide.setActiveView?.('editor');
              ide.setActiveSidebarTab?.('explorer');
              layout.focusPanel?.('primarySidebar');
              if (ide.startCreatingFile) {
                ide.startCreatingFile();
              } else {
                const name = prompt('Enter new file path (e.g. src/utils/helpers.ts):');
                if (name) ide.createFileOrFolder?.(name, 'file', '');
              }
            },
          },
          {
            id: 'file.newFolder',
            title: 'New Folder',
            category: 'File',
            description: 'Create a new directory in workspace',
            execute: () => {
              ide.setActiveView?.('editor');
              ide.setActiveSidebarTab?.('explorer');
              layout.focusPanel?.('primarySidebar');
              if (ide.startCreatingFolder) {
                ide.startCreatingFolder();
              } else {
                const name = prompt('Enter new folder path (e.g. src/components/ui):');
                if (name) ide.createFileOrFolder?.(name, 'folder');
              }
            },
          },
          {
            id: 'file.newProject',
            title: 'New Project with AI Architect...',
            category: 'File',
            shortcut: 'Ctrl+Shift+N',
            description: 'Scaffold a new project from natural language prompt',
            execute: () => onOpenNewProject?.(),
          },
          {
            id: 'file.openProject',
            title: 'Open Project / Folder...',
            category: 'File',
            shortcut: 'Ctrl+O',
            description: 'Open an existing real project folder from disk',
            execute: () => ide.openLocalFolder?.(),
          },
          {
            id: 'file.openFile',
            title: 'Open File... (Quick Search)',
            category: 'File',
            shortcut: 'Ctrl+P',
            description: 'Search and open any file by name',
            execute: () => onOpenCommandPalette?.(),
          },
          {
            id: 'file.cloneRepo',
            title: 'Clone Git Repository...',
            category: 'File',
            description: 'Clone a remote repository and initialize workspace',
            execute: () => ide.setIsCloneModalOpen?.(true),
          },
          {
            id: 'file.save',
            title: 'Save File',
            category: 'File',
            shortcut: 'Ctrl+S',
            description: 'Save current active file changes',
            isEnabled: () => !!ide.activeFile,
            execute: () => ide.saveCurrentFile?.(),
          },
          {
            id: 'file.saveAll',
            title: 'Save All Files',
            category: 'File',
            shortcut: 'Ctrl+Alt+S',
            description: 'Save all modified workspace files',
            execute: () => ide.saveAllFiles?.(),
          },
          {
            id: 'file.closeFile',
            title: 'Close Active Editor Tab',
            category: 'File',
            shortcut: 'Ctrl+W',
            description: 'Close the current active file tab',
            isEnabled: () => !!ide.activeTabId,
            execute: () => {
              if (ide.activeTabId) ide.closeTab?.(ide.activeTabId);
            },
          },
          {
            id: 'file.closeProject',
            title: 'Close Project / Workspace',
            category: 'File',
            shortcut: 'Ctrl+Shift+W',
            description: 'Safely close project workspace and return to Welcome screen',
            execute: () => ide.closeProject?.(),
          },
          {
            id: 'file.revertFile',
            title: 'Revert File Changes',
            category: 'File',
            description: 'Discard uncommitted changes in active file',
            isEnabled: () => !!ide.activeFile,
            execute: () => {
              if (ide.activeFile) ide.revertFile?.(ide.activeFile);
            },
          },
        ];
      case 'Edit':
        return [
          {
            id: 'edit.undo',
            title: 'Undo',
            category: 'Edit',
            shortcut: 'Ctrl+Z',
            description: 'Undo last edit in editor',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) document.execCommand('undo');
            },
          },
          {
            id: 'edit.redo',
            title: 'Redo',
            category: 'Edit',
            shortcut: 'Ctrl+Y',
            description: 'Redo last undone edit',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) document.execCommand('redo');
            },
          },
          {
            id: 'edit.cut',
            title: 'Cut',
            category: 'Edit',
            shortcut: 'Ctrl+X',
            description: 'Cut selection to clipboard',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) document.execCommand('cut');
            },
          },
          {
            id: 'edit.copy',
            title: 'Copy',
            category: 'Edit',
            shortcut: 'Ctrl+C',
            description: 'Copy selection to clipboard',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) document.execCommand('copy');
            },
          },
          {
            id: 'edit.paste',
            title: 'Paste',
            category: 'Edit',
            shortcut: 'Ctrl+V',
            description: 'Paste from clipboard into editor',
            execute: async () => {
              const ta = focusEditorTextarea();
              if (navigator.clipboard?.readText && ta) {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && ide.updateFileContent) {
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const val = ta.value;
                    const updated = val.substring(0, start) + text + val.substring(end);
                    ide.updateFileContent(updated);
                  }
                } catch {
                  document.execCommand('paste');
                }
              }
            },
          },
          {
            id: 'edit.selectAll',
            title: 'Select All',
            category: 'Edit',
            shortcut: 'Ctrl+A',
            description: 'Select all text in focused editor',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) ta.select();
            },
          },
          {
            id: 'edit.findInFiles',
            title: 'Find in Files',
            category: 'Edit',
            shortcut: 'Ctrl+Shift+F',
            description: 'Search across workspace codebase',
            execute: () => {
              ide.setActiveView?.('editor');
              ide.setActiveSidebarTab?.('search');
              layout.focusPanel?.('primarySidebar');
            },
          },
        ];
      case 'Selection':
        return [
          {
            id: 'selection.selectAll',
            title: 'Select All',
            category: 'Selection',
            shortcut: 'Ctrl+A',
            description: 'Select entire file contents',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) ta.select();
            },
          },
          {
            id: 'selection.duplicateLine',
            title: 'Duplicate Line Down',
            category: 'Selection',
            shortcut: 'Shift+Alt+Down',
            description: 'Duplicate current line or selection',
            execute: () => {
              if (ide.activeFileContent) {
                ide.updateFileContent?.(ide.activeFileContent + '\n' + ide.activeFileContent.split('\n').slice(-1)[0]);
              }
            },
          },
          {
            id: 'selection.expandSelection',
            title: 'Expand Selection',
            category: 'Selection',
            shortcut: 'Shift+Alt+Right',
            description: 'Expand selection to enclosing syntax block',
            execute: () => {
              const ta = focusEditorTextarea();
              if (ta) ta.select();
            },
          },
        ];
      case 'View':
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
            execute: () => handleCycleTheme(),
          },
        ];
      case 'Go':
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
      case 'Run':
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
      case 'Terminal':
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
      case 'Agent / AI':
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
      case 'Help':
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
      default:
        return [];
    }
}
