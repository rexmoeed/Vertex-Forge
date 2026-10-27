import { useState, useCallback } from 'react';
import { OpenTab } from '../../types/ide';
import { VirtualFileSystem } from '../../services/virtualFs';
import { OpenFileRequest, editorFileService } from '../../services/editorFileService';
import { DesktopBridge } from '../../services/desktopBridge';

interface UseIDEEditorFilesParams {
  vfs: VirtualFileSystem;
  activeProjectId: string;
  setCursorPosition: (pos: { line: number; column: number }) => void;
  setActiveView: (view: any) => void;
  logAgentAction: (agent: any, message: string, type?: any) => void;
  refreshGit: () => Promise<void>;
}

export function useIDEEditorFiles({
  vfs,
  activeProjectId,
  setCursorPosition,
  setActiveView,
  logAgentAction,
  refreshGit,
}: UseIDEEditorFilesParams) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(1000);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const startCreatingFile = useCallback(() => setIsCreatingFile(true), []);
  const startCreatingFolder = useCallback(() => setIsCreatingFolder(true), []);

  const openFileInEditor = useCallback(
    async (request: OpenFileRequest | string, diffMode: boolean = false): Promise<OpenTab> => {
      const req: OpenFileRequest =
        typeof request === 'string'
          ? { workspaceId: activeProjectId, path: request, source: 'explorer', diffMode }
          : request;

      const normalizedPath = req.path.replace(/\\/g, '/');
      const fileName = normalizedPath.split('/').pop() || normalizedPath;
      const language = editorFileService.detectLanguage(normalizedPath);

      const existingTab = openTabs.find(t => t.filePath === normalizedPath);
      let content = vfs.readFile(normalizedPath);
      if (content === null || content === undefined) {
        try {
          content = await DesktopBridge.readFile(normalizedPath);
          vfs.writeFile(normalizedPath, content);
        } catch {
          content = '';
        }
      }

      if (req.line) {
        setCursorPosition({ line: req.line, column: req.column || 1 });
      }

      if (existingTab) {
        setActiveTabId(existingTab.id);
        setActiveFile(normalizedPath);
        setActiveFileContent(content);
        setActiveView('editor');
        logAgentAction('Developer', `Activated tab "${existingTab.title}"`, 'info');
        return existingTab;
      } else {
        const newTab: OpenTab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          filePath: normalizedPath,
          title: fileName,
          language,
          diffMode: req.diffMode ?? diffMode,
          isDirty: false,
        };
        setOpenTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setActiveFile(normalizedPath);
        setActiveFileContent(content);
        setActiveView('editor');
        logAgentAction('Developer', `Opened "${newTab.title}" in editor`, 'info');
        return newTab;
      }
    },
    [openTabs, vfs, activeProjectId, setCursorPosition, setActiveView, logAgentAction]
  );

  const openFile = useCallback(
    async (pathOrReq: string | OpenFileRequest, diffMode: boolean = false) => {
      return openFileInEditor(pathOrReq, diffMode);
    },
    [openFileInEditor]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setOpenTabs(prev => {
        const filtered = prev.filter(t => t.id !== tabId);
        if (activeTabId === tabId) {
          const nextTab = filtered[filtered.length - 1];
          if (nextTab) {
            setActiveTabId(nextTab.id);
            setActiveFile(nextTab.filePath);
            const c = vfs.readFile(nextTab.filePath);
            if (c !== null && c !== undefined) setActiveFileContent(c);
          } else {
            setActiveTabId(null);
            setActiveFile(null);
            setActiveFileContent('');
          }
        }
        return filtered;
      });
    },
    [activeTabId, vfs]
  );

  const updateFileContent = useCallback(
    (newContent: string) => {
      setActiveFileContent(newContent);
      if (activeFile) {
        vfs.writeFile(activeFile, newContent);
        setOpenTabs(prev =>
          prev.map(t => (t.filePath === activeFile ? { ...t, content: newContent, isDirty: true } : t))
        );
      }
    },
    [activeFile, vfs]
  );

  const saveCurrentFile = useCallback(async () => {
    if (!activeFile) return;
    setIsAutoSaving(true);
    vfs.writeFile(activeFile, activeFileContent);
    await DesktopBridge.writeFile(activeFile, activeFileContent);
    setOpenTabs(prev => (prev.map(t => (t.filePath === activeFile ? { ...t, isDirty: false } : t))));
    setIsAutoSaving(false);
    refreshGit();
  }, [activeFile, activeFileContent, vfs, refreshGit]);

  const saveAllFiles = useCallback(async () => {
    for (const tab of openTabs) {
      if (tab.isDirty) {
        const c = vfs.readFile(tab.filePath) ?? '';
        vfs.writeFile(tab.filePath, c);
        await DesktopBridge.writeFile(tab.filePath, c);
      }
    }
    setOpenTabs(prev => prev.map(t => ({ ...t, isDirty: false })));
    refreshGit();
  }, [openTabs, vfs, refreshGit]);

  const createFileOrFolder = useCallback(
    async (path: string, type: 'file' | 'folder', initialContent: string = '') => {
      if (type === 'file') {
        vfs.writeFile(path, initialContent);
        await DesktopBridge.writeFile(path, initialContent);
        await openFile(path);
      } else {
        vfs.writeFile(`${path}/.keep`, '');
        await DesktopBridge.createDirectory(path);
      }
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      refreshGit();
    },
    [vfs, openFile, refreshGit]
  );

  const renameFileOrFolder = useCallback(
    async (oldPath: string, newPath: string) => {
      const content = vfs.readFile(oldPath) ?? '';
      vfs.writeFile(newPath, content);
      vfs.deleteNode(oldPath);
      setOpenTabs(prev =>
        prev.map(t =>
          t.filePath === oldPath ? { ...t, filePath: newPath, title: newPath.split('/').pop() || newPath } : t
        )
      );
      if (activeFile === oldPath) setActiveFile(newPath);
      refreshGit();
      return true;
    },
    [vfs, activeFile, refreshGit]
  );

  const deleteFileOrFolder = useCallback(
    async (path: string) => {
      vfs.deleteNode(path);
      await DesktopBridge.deletePath(path);
      setOpenTabs(prev => prev.filter(t => !t.filePath.startsWith(path)));
      if (activeFile === path) {
        setActiveFile(null);
        setActiveFileContent('');
      }
      refreshGit();
    },
    [vfs, activeFile, refreshGit]
  );

  return {
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    activeFile,
    setActiveFile,
    activeFileContent,
    setActiveFileContent,
    autoSave,
    setAutoSave,
    autoSaveDelay,
    setAutoSaveDelay,
    isAutoSaving,
    isCreatingFile,
    setIsCreatingFile,
    isCreatingFolder,
    setIsCreatingFolder,
    startCreatingFile,
    startCreatingFolder,
    openFileInEditor,
    openFile,
    closeTab,
    updateFileContent,
    saveCurrentFile,
    saveAllFiles,
    createFileOrFolder,
    renameFileOrFolder,
    deleteFileOrFolder,
  };
}
