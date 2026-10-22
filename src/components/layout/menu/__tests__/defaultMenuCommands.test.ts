import { describe, it, expect, vi } from 'vitest';
import { getDefaultCategoryCommands, MenuActionContext } from '../defaultMenuCommands';

describe('Default Menu Commands Engine', () => {
  const mockContext: MenuActionContext = {
    ide: {
      setActiveView: vi.fn(),
      setActiveSidebarTab: vi.fn(),
      openLocalFolder: vi.fn(),
      startCreatingFile: vi.fn(),
      startCreatingFolder: vi.fn(),
    },
    layout: {
      focusPanel: vi.fn(),
      togglePanel: vi.fn(),
    },
    onOpenNewProject: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    onOpenShortcuts: vi.fn(),
    focusEditorTextarea: vi.fn().mockReturnValue(null),
  };

  it('provides comprehensive file commands with shortcuts', () => {
    const fileCommands = getDefaultCategoryCommands('File', mockContext);
    expect(fileCommands.length).toBeGreaterThanOrEqual(5);

    const newFile = fileCommands.find(c => c.id === 'file.newFile');
    expect(newFile).toBeDefined();
    expect(newFile?.shortcut).toBe('Ctrl+N');

    newFile?.execute();
    expect(mockContext.ide.setActiveView).toHaveBeenCalledWith('editor');

    const newProj = fileCommands.find(c => c.id === 'file.newProject');
    newProj?.execute();
    expect(mockContext.onOpenNewProject).toHaveBeenCalled();
  });

  it('provides editing and clipboard commands', () => {
    const editCommands = getDefaultCategoryCommands('Edit', mockContext);
    expect(editCommands.length).toBeGreaterThanOrEqual(4);

    expect(editCommands.some(c => c.id === 'edit.undo')).toBe(true);
    expect(editCommands.some(c => c.id === 'edit.findInFiles')).toBe(true);
  });

  it('provides view, terminal, and agent execution commands', () => {
    const viewCommands = getDefaultCategoryCommands('View', mockContext);
    expect(viewCommands.some(c => c.id === 'view.explorer')).toBe(true);

    const termCommands = getDefaultCategoryCommands('Terminal', mockContext);
    expect(termCommands.some(c => c.id === 'terminal.new')).toBe(true);

    const agentCommands = getDefaultCategoryCommands('Agent / AI', mockContext);
    expect(agentCommands.some(c => c.id === 'ai.composer')).toBe(true);
  });

  it('provides help and about dialog commands', () => {
    const helpCommands = getDefaultCategoryCommands('Help', mockContext);
    expect(helpCommands.some(c => c.id === 'help.about')).toBe(true);
  });
});
