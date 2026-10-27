import { Command } from '../commandRegistry';
import { CommandContext } from './types';

export function createFileAndEditCommands(ctx: CommandContext): Command[] {
  const { ide, layout, onOpenNewProject } = ctx;

  return [
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
  ];
}
