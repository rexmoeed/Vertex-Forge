import { Command } from '../../../../services/commandRegistry';
import { MenuActionContext } from './menuActionContext';

export function getFileCommands(ctx: MenuActionContext): Command[] {
  const { ide, layout, onOpenNewProject, onOpenCommandPalette } = ctx;

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
}
