import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { VirtualFileSystem } from '../services/virtualFs';
import { DesktopBridge } from '../services/desktopBridge';
import { OpenTab } from '../types/ide';

export interface FileSystemContextType {
  vfs: VirtualFileSystem;
  setVfs: React.Dispatch<React.SetStateAction<VirtualFileSystem>>;
  openTabs: OpenTab[];
  setOpenTabs: React.Dispatch<React.SetStateAction<OpenTab[]>>;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  activeFile: string | null;
  setActiveFile: (file: string | null) => void;
  activeFileContent: string;
  setActiveFileContent: (content: string) => void;

  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  autoSaveDelay: number;
  setAutoSaveDelay: (delay: number) => void;
  isAutoSaving: boolean;

  isCreatingFile: boolean;
  setIsCreatingFile: (creating: boolean) => void;
  isCreatingFolder: boolean;
  setIsCreatingFolder: (creating: boolean) => void;
  startCreatingFile: () => void;
  startCreatingFolder: () => void;
  cancelCreating: () => void;

  openFile: (filePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  updateFileContent: (newContent: string) => void;
  saveCurrentFile: () => Promise<void>;
  saveAllDirtyFiles: () => Promise<void>;
  createFileOrFolder: (path: string, type: 'file' | 'folder', initialContent?: string) => Promise<void>;
  renameFileOrFolder: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteFileOrFolder: (path: string) => Promise<void>;
}

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export interface FileSystemProviderProps {
  children: ReactNode;
  initialVfs?: VirtualFileSystem;
  onFileSaved?: (filePath: string) => void;
  onMutation?: (action: string, path: string) => void;
}

export const FileSystemProvider: React.FC<FileSystemProviderProps> = ({
  children,
  initialVfs,
  onFileSaved,
  onMutation,
}) => {
  const [vfs, setVfs] = useState<VirtualFileSystem>(() => initialVfs || new VirtualFileSystem([]));
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('vertexforge_autosave') !== 'false';
    }
    return true;
  });
  const [autoSaveDelay, setAutoSaveDelay] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('vertexforge_autosave_delay') || '1000', 10);
    }
    return 1000;
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const activeFileRef = useRef<string | null>(activeFile);
  activeFileRef.current = activeFile;
  const activeFileContentRef = useRef<string>(activeFileContent);
  activeFileContentRef.current = activeFileContent;
  const openTabsRef = useRef<OpenTab[]>(openTabs);
  openTabsRef.current = openTabs;
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startCreatingFile = useCallback(() => {
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
  }, []);

  const startCreatingFolder = useCallback(() => {
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
  }, []);

  const cancelCreating = useCallback(() => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
  }, []);

  const openFile = useCallback(async (filePath: string) => {
    let content = vfs.readFile(filePath);
    if (content === null) {
      try {
        content = await DesktopBridge.readFile(filePath);
        vfs.writeFile(filePath, content);
      } catch {
        content = '';
      }
    }

    setActiveFile(filePath);
    activeFileRef.current = filePath;
    setActiveFileContent(content);
    activeFileContentRef.current = content;

    setOpenTabs((prev) => {
      const existing = prev.find((t) => t.filePath === filePath);
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }
      const newTab: OpenTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filePath,
        title: filePath.split('/').pop() || filePath,
        isDirty: false,
      };
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
  }, [vfs]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const closingTab = prev.find((t) => t.id === tabId);
      const remaining = prev.filter((t) => t.id !== tabId);

      if (closingTab && closingTab.id === activeTabId) {
        if (remaining.length > 0) {
          const nextTab = remaining[remaining.length - 1];
          setActiveTabId(nextTab.id);
          setActiveFile(nextTab.filePath);
          setActiveFileContent(vfs.readFile(nextTab.filePath) || '');
        } else {
          setActiveTabId(null);
          setActiveFile(null);
          setActiveFileContent('');
        }
      }
      return remaining;
    });
  }, [activeTabId, vfs]);

  const closeOtherTabs = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const target = prev.find((t) => t.id === tabId);
      if (!target) return prev;
      setActiveTabId(target.id);
      setActiveFile(target.filePath);
      setActiveFileContent(vfs.readFile(target.filePath) || '');
      return [target];
    });
  }, [vfs]);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId(null);
    setActiveFile(null);
    setActiveFileContent('');
  }, []);

  const saveCurrentFile = useCallback(async () => {
    const currentPath = activeFileRef.current;
    if (!currentPath) return;

    setIsAutoSaving(true);
    try {
      const content = activeFileContentRef.current;
      vfs.writeFile(currentPath, content);
      try {
        await DesktopBridge.writeFile(currentPath, content);
      } catch {}

      setOpenTabs((prev) =>
        prev.map((t) => (t.filePath === currentPath ? { ...t, isDirty: false } : t))
      );
      onFileSaved?.(currentPath);
      onMutation?.('save', currentPath);
    } finally {
      setTimeout(() => setIsAutoSaving(false), 300);
    }
  }, [vfs, onFileSaved, onMutation]);

  const updateFileContent = useCallback((newContent: string) => {
    setActiveFileContent(newContent);
    activeFileContentRef.current = newContent;
    const currentPath = activeFileRef.current;
    if (currentPath) {
      setOpenTabs((prev) =>
        prev.map((t) => (t.filePath === currentPath ? { ...t, isDirty: true } : t))
      );

      if (autoSave) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
          saveCurrentFile();
        }, autoSaveDelay);
      }
    }
  }, [autoSave, autoSaveDelay, saveCurrentFile]);

  const saveAllDirtyFiles = useCallback(async () => {
    setIsAutoSaving(true);
    try {
      for (const tab of openTabsRef.current) {
        if (tab.isDirty) {
          const content = tab.filePath === activeFileRef.current ? activeFileContentRef.current : vfs.readFile(tab.filePath) || '';
          vfs.writeFile(tab.filePath, content);
          try {
            await DesktopBridge.writeFile(tab.filePath, content);
          } catch {}
        }
      }
      setOpenTabs((prev) => prev.map((t) => ({ ...t, isDirty: false })));
      onMutation?.('save_all', 'workspace');
    } finally {
      setTimeout(() => setIsAutoSaving(false), 300);
    }
  }, [vfs, onMutation]);

  const createFileOrFolder = useCallback(async (path: string, type: 'file' | 'folder', initialContent: string = '') => {
    if (type === 'file') {
      vfs.writeFile(path, initialContent);
      try {
        await DesktopBridge.createFile(path, initialContent);
      } catch {}
      await openFile(path);
    } else {
      vfs.writeFile(`${path}/.keep`, '');
      try {
        await DesktopBridge.createDirectory(path);
      } catch {}
    }
    setVfs(new VirtualFileSystem(vfs.getTree()));
    onMutation?.(`create_${type}`, path);
  }, [vfs, openFile, onMutation]);

  const renameFileOrFolder = useCallback(async (oldPath: string, newPath: string) => {
    let bridgeOk = false;
    try {
      const res = await DesktopBridge.renamePath(oldPath, newPath);
      bridgeOk = res.success;
    } catch {
      bridgeOk = true;
    }

    if (bridgeOk) {
      const content = vfs.readFile(oldPath) ?? '';
      vfs.writeFile(newPath, content);
      vfs.deleteNode(oldPath);
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.filePath === oldPath
            ? { ...t, filePath: newPath, title: newPath.split('/').pop() || newPath }
            : t
        )
      );
      if (activeFileRef.current === oldPath) {
        setActiveFile(newPath);
      }
      setVfs(new VirtualFileSystem(vfs.getTree()));
      onMutation?.('rename', `${oldPath}->${newPath}`);
      return true;
    }
    return false;
  }, [vfs, onMutation]);

  const deleteFileOrFolder = useCallback(async (path: string) => {
    vfs.deleteNode(path);
    try {
      await DesktopBridge.deletePath(path);
    } catch {}
    setOpenTabs((prev) => prev.filter((t) => !t.filePath.startsWith(path)));
    if (activeFileRef.current && activeFileRef.current.startsWith(path)) {
      setActiveFile(null);
      setActiveFileContent('');
    }
    setVfs(new VirtualFileSystem(vfs.getTree()));
    onMutation?.('delete', path);
  }, [vfs, onMutation]);

  const value: FileSystemContextType = {
    vfs,
    setVfs,
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
    cancelCreating,
    openFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    updateFileContent,
    saveCurrentFile,
    saveAllDirtyFiles,
    createFileOrFolder,
    renameFileOrFolder,
    deleteFileOrFolder,
  };

  return <FileSystemContext.Provider value={value}>{children}</FileSystemContext.Provider>;
};

export function useFileSystem(): FileSystemContextType {
  const ctx = useContext(FileSystemContext);
  if (!ctx) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return ctx;
}
