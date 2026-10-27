import { Command } from '../../../../services/commandRegistry';
import { MenuActionContext } from './menuActionContext';

export function getEditCommands(ctx: MenuActionContext): Command[] {
  const { ide, layout, focusEditorTextarea } = ctx;

  return [
    {
      id: 'edit.undo',
      title: 'Undo',
      category: 'Edit',
      shortcut: 'Ctrl+Z',
      description: 'Undo last edit in editor',
      execute: () => {
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
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
}

export function getSelectionCommands(ctx: MenuActionContext): Command[] {
  const { ide, focusEditorTextarea } = ctx;

  return [
    {
      id: 'selection.selectAll',
      title: 'Select All',
      category: 'Selection',
      shortcut: 'Ctrl+A',
      description: 'Select entire file contents',
      execute: () => {
        const ta = focusEditorTextarea?.();
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
        const ta = focusEditorTextarea?.();
        if (ta) ta.select();
      },
    },
  ];
}
