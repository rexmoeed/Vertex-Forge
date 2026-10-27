import { describe, it, expect, vi } from 'vitest';
import { createFileAndEditCommands } from '../fileAndEditCommands';
import { createViewAndWindowCommands } from '../viewAndWindowCommands';
import { createRunAndTerminalCommands } from '../runAndTerminalCommands';
import { createAiAndHelpCommands } from '../aiAndHelpCommands';
import { CommandContext } from '../types';

describe('Modular Command Registries', () => {
  if (typeof document !== 'undefined') {
    (document as any).execCommand = vi.fn();
  }
  if (typeof window !== 'undefined') {
    window.prompt = vi.fn().mockReturnValue('test-input');
    window.alert = vi.fn();
  }

  const createAutoMock = (target: any = {}) => {
    return new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) return obj[prop];
        obj[prop] = vi.fn();
        return obj[prop];
      },
    });
  };

  const rawIde = {
    createFileOrFolder: vi.fn(),
    openLocalFolder: vi.fn(),
    setIsCloneModalOpen: vi.fn(),
    saveCurrentFile: vi.fn(),
    saveAllFiles: vi.fn(),
    closeTab: vi.fn(),
    closeProject: vi.fn(),
    revertFile: vi.fn(),
    setActiveView: vi.fn(),
    setActiveSidebarTab: vi.fn(),
    toggleTheme: vi.fn(),
    runTests: vi.fn(),
    runLint: vi.fn(),
    runCommand: vi.fn(),
    clearTerminal: vi.fn(),
    setCursorMode: vi.fn(),
    triggerSelfHealDebug: vi.fn(),
    runSecurityReview: vi.fn(),
    setIsProjectIntelligenceOpen: vi.fn(),
    setIsControlPanelOpen: vi.fn(),
    setIsMultiFileReviewOpen: vi.fn(),
    commitChanges: vi.fn(),
    debuggerEngine: {
      startSession: vi.fn(),
      stopSession: vi.fn(),
      stepOver: vi.fn(),
      stepInto: vi.fn(),
      stepOut: vi.fn(),
    },
    problems: [],
    testResults: [],
    modifiedFiles: ['src/App.tsx'],
    activeFile: 'src/App.tsx',
    activeTabId: 'tab-1',
    activeFileContent: 'const greeting = "hello";\nconsole.log(greeting);',
  };

  const mockCtx: CommandContext = {
    ide: createAutoMock(rawIde),
    layout: createAutoMock({
      togglePrimarySidebar: vi.fn(),
      toggleSecondarySidebar: vi.fn(),
      toggleBottomPanel: vi.fn(),
      togglePreview: vi.fn(),
      toggleActivityBar: vi.fn(),
      toggleZenMode: vi.fn(),
      splitEditor: vi.fn(),
      closeEditorSplit: vi.fn(),
      applyPreset: vi.fn(),
      resetLayout: vi.fn(),
      focusPanel: vi.fn(),
      toggleBottomPanelMaximized: vi.fn(),
    }),
    onOpenCommandPalette: vi.fn(),
    onOpenShortcuts: vi.fn(),
    onOpenNewProject: vi.fn(),
    onOpenComposer: vi.fn(),
    onOpenCursorRules: vi.fn(),
  };

  it('creates valid file and edit commands with executable handlers', () => {
    const fileCommands = createFileAndEditCommands(mockCtx);
    expect(fileCommands.length).toBeGreaterThan(10);
    for (const cmd of fileCommands) {
      expect(cmd.id).toBeDefined();
      expect(cmd.category).toBeDefined();
      cmd.execute();
    }
    expect(mockCtx.ide.saveCurrentFile).toHaveBeenCalled();
  });

  it('creates valid view and layout commands with focus handlers', () => {
    const viewCommands = createViewAndWindowCommands(mockCtx);
    expect(viewCommands.length).toBeGreaterThan(15);
    for (const cmd of viewCommands) {
      expect(cmd.id).toBeDefined();
      cmd.execute();
    }
    expect(mockCtx.layout.toggleZenMode).toHaveBeenCalled();
  });

  it('creates valid run and terminal commands', () => {
    const runCommands = createRunAndTerminalCommands(mockCtx);
    expect(runCommands.length).toBeGreaterThan(8);
    for (const cmd of runCommands) {
      expect(cmd.id).toBeDefined();
      cmd.execute();
    }
    expect(mockCtx.ide.runTests).toHaveBeenCalled();
  });

  it('creates valid AI, project, and git commands', () => {
    const aiCommands = createAiAndHelpCommands(mockCtx);
    expect(aiCommands.length).toBeGreaterThan(10);
    for (const cmd of aiCommands) {
      expect(cmd.id).toBeDefined();
      cmd.execute();
    }
    expect(mockCtx.onOpenComposer).toHaveBeenCalled();
  });
});
