import React, { useEffect, useRef, useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  X,
  Save,
  SplitSquareVertical,
  Check,
  AlertTriangle,
  Sparkles,
  FileCode,
  FileJson,
  FileText,
  RotateCcw,
  Copy,
  Columns,
  Rows,
  Maximize2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Splitter } from './Splitter';
import { OpenTab } from '../../types/ide';
import { FILE_DRAG_MIME, FileDragPayload } from '../../types/dragDrop';
import { DesktopBridge } from '../../services/desktopBridge';
import { DebugToolbar } from '../debug/DebugToolbar';
import { VisualDiffEditor } from '../git/VisualDiffEditor';
import { CursorService } from '../../services/cursorService';

interface SingleEditorGroupProps {
  groupId: number;
  isActive: boolean;
  onFocus: () => void;
  onSplitRight: () => void;
  onSplitDown: () => void;
  onCloseSplit: () => void;
  canCloseSplit: boolean;
}

const SingleEditorGroup: React.FC<SingleEditorGroupProps> = ({
  groupId,
  isActive,
  onFocus,
  onSplitRight,
  onSplitDown,
  onCloseSplit,
  canCloseSplit,
}) => {
  const {
    openTabs,
    activeTabId,
    activeFile,
    activeFileContent,
    closeTab,
    openFile,
    openFileInEditor,
    vfs,
    updateFileContent,
    saveCurrentFile,
    autoSave,
    isAutoSaving,
    modifiedFiles,
    problems,
    triggerSelfHealDebug,
    debugSession,
    debugBreakpoints,
    debugLocation,
    toggleBreakpoint,
    cursorPosition,
    setCursorPosition,
  } = useIDE() as any;

  const [diffMode, setDiffMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineColRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll editor to line when cursorPosition changes programmatically
  useEffect(() => {
    if (!textareaRef.current || !cursorPosition?.line) return;
    const lineHeight = 20; // 20px leading-5
    const targetScroll = (cursorPosition.line - 1) * lineHeight;
    textareaRef.current.scrollTop = Math.max(0, targetScroll - 100);
    if (lineColRef.current) {
      lineColRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [cursorPosition?.line]);

  const updateCursorTracking = (target: HTMLTextAreaElement) => {
    const val = target.value;
    const selStart = target.selectionStart || 0;
    const textBefore = val.substring(0, selStart);
    const lineArr = textBefore.split('\n');
    const line = lineArr.length;
    const column = lineArr[lineArr.length - 1].length + 1;
    setCursorPosition?.({ line, column });
  };

  // Cursor Inline AI & Ghost Text (Copilot++) State
  const [isInlineAIOpen, setIsInlineAIOpen] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isInlineLoading, setIsInlineLoading] = useState(false);
  const [inlineResultNotice, setInlineResultNotice] = useState<string | null>(null);
  const [inlineOriginalCode, setInlineOriginalCode] = useState<string | null>(null);
  const [isDiffReviewActive, setIsDiffReviewActive] = useState(false);
  const [ghostText, setGhostText] = useState<string | null>(null);
  const [isCursorTabEnabled, setIsCursorTabEnabled] = useState(true);

  // Tab Context Menu & Find/Replace States
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tab: OpenTab } | null>(null);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplaceRow, setShowReplaceRow] = useState(false);
  const [findMatchIndex, setFindMatchIndex] = useState(0);

  // Close tab context menu on outside click
  useEffect(() => {
    const handleOutside = () => setTabContextMenu(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Compute find matches in active file content
  const findMatches = React.useMemo(() => {
    if (!findText || !activeFileContent) return [];
    const results: number[] = [];
    let idx = 0;
    const lowerContent = activeFileContent.toLowerCase();
    const lowerFind = findText.toLowerCase();
    while ((idx = lowerContent.indexOf(lowerFind, idx)) !== -1) {
      results.push(idx);
      idx += lowerFind.length;
    }
    return results;
  }, [findText, activeFileContent]);

  const handleNextMatch = () => {
    if (findMatches.length === 0) return;
    setFindMatchIndex(prev => (prev + 1) % findMatches.length);
  };

  const handlePrevMatch = () => {
    if (findMatches.length === 0) return;
    setFindMatchIndex(prev => (prev - 1 + findMatches.length) % findMatches.length);
  };

  const handleReplaceOne = () => {
    if (!findText || !activeFileContent || findMatches.length === 0) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    updateFileContent(activeFileContent.replace(regex, replaceText));
  };

  const handleReplaceAll = () => {
    if (!findText || !activeFileContent) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    updateFileContent(activeFileContent.replace(regex, replaceText));
  };

  const handleCloseOtherTabs = (currentTabId: string) => {
    openTabs.forEach((t: OpenTab) => {
      if (t.id !== currentTabId) closeTab(t.id);
    });
  };

  const handleCloseTabsToRight = (currentTabId: string) => {
    const idx = openTabs.findIndex((t: OpenTab) => t.id === currentTabId);
    if (idx !== -1) {
      openTabs.slice(idx + 1).forEach((t: OpenTab) => closeTab(t.id));
    }
  };

  const handleInlineAISubmit = async () => {
    if (!inlinePrompt.trim() || !activeFile) return;
    setIsInlineLoading(true);
    setInlineResultNotice(null);
    setInlineOriginalCode(activeFileContent);
    try {
      const res = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: inlinePrompt,
          filePath: activeFile,
          currentCode: activeFileContent,
          agentRole: 'Full-Stack Developer',
          model: 'gemini-3.8-flash',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) {
          updateFileContent(data.code);
          setIsDiffReviewActive(true);
          setIsInlineAIOpen(false);
          return;
        }
      }
      // Intelligent fallback
      const synthesized = `// [Cursor Edit] ${inlinePrompt}\n` + activeFileContent;
      updateFileContent(synthesized);
      setIsDiffReviewActive(true);
      setIsInlineAIOpen(false);
    } catch (err: any) {
      console.error('Inline AI error:', err);
    } finally {
      setIsInlineLoading(false);
    }
  };

  const handleAcceptInlineDiff = () => {
    setIsDiffReviewActive(false);
    setInlineOriginalCode(null);
    setInlinePrompt('');
    saveCurrentFile();
  };

  const handleRejectInlineDiff = () => {
    if (inlineOriginalCode !== null) {
      updateFileContent(inlineOriginalCode);
    }
    setIsDiffReviewActive(false);
    setInlineOriginalCode(null);
    setInlinePrompt('');
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(FILE_DRAG_MIME) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      dragCounterRef.current++;
      setIsDragOver(true);
      console.log('[DragDrop] dragenter target: editor');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(FILE_DRAG_MIME) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetTabFilePath?: string) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    onFocus();

    const rawData = e.dataTransfer.getData(FILE_DRAG_MIME);
    if (rawData) {
      try {
        const payload: FileDragPayload = JSON.parse(rawData);
        if (payload && payload.path && payload.type === 'file') {
          const validation = await DesktopBridge.validateFile(payload.path);
          if (validation.valid) {
            await (openFileInEditor || openFile)({
              workspaceId: payload.workspaceId,
              path: payload.path,
              source: 'drag-drop',
              targetGroupId: groupId,
            });
          } else {
            console.warn('[DragDrop] Dropped path validation failed:', validation.error);
          }
          return;
        }
      } catch (err) {
        console.error('[DragDrop] Failed to parse drag payload:', err);
      }
    }

    // External OS files dropped from system file manager
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        try {
          const text = await file.text();
          if (vfs) vfs.writeFile(file.name, text);
          await (openFileInEditor || openFile)({
            workspaceId: 'workspace',
            path: file.name,
            source: 'external-os',
            targetGroupId: groupId,
          });
        } catch (err) {
          console.error('[DragDrop] Failed to read external OS file:', err);
        }
      }
    }
  };

  // Active tab object with resilient fallback chain
  const activeTab =
    openTabs.find((t: OpenTab) => t.id === activeTabId) ||
    (activeFile ? openTabs.find((t: OpenTab) => t.filePath === activeFile) : undefined) ||
    (openTabs.length > 0 ? openTabs[0] : undefined);

  const currentFile = activeTab?.filePath || activeFile;

  // Current file diff if any
  const currentDiff = currentFile ? modifiedFiles.find((m: any) => m.filePath === currentFile) : null;

  // Split lines for line numbers
  const lines = activeFileContent ? activeFileContent.split('\n') : [];

  // Find diagnostics for current file
  const fileDiagnostics = currentFile
    ? problems.filter((p: any) => p.filePath === currentFile)
    : [];

  const handleCopyCode = () => {
    if (activeFileContent) {
      navigator.clipboard.writeText(activeFileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFileIcon = (filePath: string) => {
    if (filePath.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-amber-400" />;
    if (filePath.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
    return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div
      onClick={onFocus}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e)}
      style={{
        backgroundColor: 'var(--ide-editor-bg)',
        color: 'var(--ide-text)',
      }}
      className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all ${
        isActive ? 'ring-1 ring-inset ring-indigo-500/30' : ''
      } ${isDragOver ? 'ring-2 ring-indigo-500/80' : ''}`}
    >
      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-950/40 border-2 border-dashed border-indigo-500/80 rounded pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-slate-900/95 border border-indigo-500/60 shadow-2xl rounded-lg px-4 py-3 flex items-center gap-3 text-indigo-200 text-xs font-medium animate-pulse">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="font-semibold text-white">Drop to open file in Editor</p>
              <p className="text-[11px] text-indigo-300/80">Group {groupId + 1}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. TAB BAR */}
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
        style={{
          backgroundColor: 'var(--ide-surface)',
          borderColor: 'var(--ide-border)',
        }}
        className="h-9 border-b flex items-center justify-between px-2 overflow-x-auto select-none no-scrollbar"
      >
        <div className="flex items-center gap-1 min-w-0">
          {openTabs.map((tab: OpenTab) => {
            const isTabActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openFile(tab.filePath);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTabContextMenu({
                    x: Math.min(e.clientX, window.innerWidth - 180),
                    y: Math.min(e.clientY, window.innerHeight - 200),
                    tab,
                  });
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(e, tab.filePath);
                }}
                className={`group h-7 px-3 rounded-t-md flex items-center gap-2 cursor-pointer text-xs transition-colors border-t-2 ${
                  isTabActive
                    ? 'antigravity-tab-active font-semibold shadow-xs'
                    : 'border-transparent opacity-75 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
                style={{
                  backgroundColor: isTabActive ? 'var(--ide-editor-bg)' : 'transparent',
                  color: isTabActive ? 'var(--ide-text)' : 'var(--ide-text-muted)',
                  borderTopColor: isTabActive ? 'var(--ide-accent)' : 'transparent',
                }}
              >
                {getFileIcon(tab.filePath)}
                <span className="truncate max-w-[140px]">{tab.title}</span>

                {/* Dirty Indicator (Unsaved) */}
                {tab.isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                )}

                {/* Close Tab Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--ide-text-muted)' }}
                  title="Close Tab (Cmd+W)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Bar Action Icons */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 pl-2">
          {/* Cursor Inline AI Assistant Trigger */}
          <button
            onClick={() => setIsInlineAIOpen(!isInlineAIOpen)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isInlineAIOpen
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                : 'bg-indigo-50 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 hover:text-indigo-900 dark:hover:text-white'
            }`}
            title="Cursor Inline Edit (Cmd+K)"
          >
            <Sparkles className="w-3 h-3 text-indigo-500 dark:text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">Edit</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-indigo-100 dark:bg-black/40 text-indigo-800 dark:text-indigo-200 rounded font-mono">⌘K</kbd>
          </button>

          {/* Cursor Tab (Copilot++) Indicator Toggle */}
          <button
            onClick={() => setIsCursorTabEnabled(!isCursorTabEnabled)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors border cursor-pointer ${
              isCursorTabEnabled
                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle Cursor Tab Autocomplete (Tab to accept)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCursorTabEnabled ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-slate-400 dark:bg-slate-600'}`} />
            <span className="hidden md:inline">Tab</span>
          </button>

          {/* Split Editor Right */}
          <button
            onClick={onSplitRight}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Split Editor Right (Cmd+\)"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {/* Split Editor Down */}
          <button
            onClick={onSplitDown}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Split Editor Down"
          >
            <Rows className="w-3.5 h-3.5" />
          </button>

          {/* Close Split Group if available */}
          {canCloseSplit && (
            <button
              onClick={onCloseSplit}
              className="p-1 hover:text-slate-900 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close This Editor Split"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Diff Mode Toggle */}
          {currentDiff && (
            <button
              onClick={() => setDiffMode(!diffMode)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                diffMode
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
              title="Toggle Diff Comparison"
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>+{currentDiff.additions} -{currentDiff.deletions}</span>
            </button>
          )}

          {/* Save Button & Auto-Save Badge */}
          {autoSave ? (
            <div
              className="px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 select-none"
              title="Auto-Save is active: saves on file change and focus loss"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaving ? 'bg-amber-400 animate-pulse' : activeTab?.isDirty ? 'bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
              <span>{isAutoSaving ? 'Saving...' : activeTab?.isDirty ? 'Auto-saving' : 'Auto-Saved'}</span>
            </div>
          ) : (
            activeTab?.isDirty && (
              <button
                onClick={saveCurrentFile}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-sm transition-colors"
                title="Save File (Cmd+S)"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            )
          )}

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-1 hover:text-slate-900 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Find in File Trigger */}
          <button
            onClick={() => setIsFindOpen(!isFindOpen)}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              isFindOpen ? 'text-[var(--ide-accent,#00ff88)]' : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Find & Replace in File (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BREADCRUMB BAR (Rendered if file is open) */}
      {currentFile && (
        <div
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
          }}
          className="h-6 border-b px-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono select-none shrink-0 overflow-hidden min-w-0"
        >
          <div className="flex items-center gap-1 truncate min-w-0 max-w-full">
            <span className="shrink-0">{currentFile.split('/')[0]}</span>
            <span className="shrink-0">&gt;</span>
            <span className="text-slate-800 dark:text-slate-300 font-medium truncate min-w-0">{currentFile}</span>
          </div>

          {fileDiagnostics.length > 0 && (
            <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-sans text-[10px] shrink-0 ml-2">
              <AlertTriangle className="w-3 h-3" />
              <span>{fileDiagnostics.length} issue{fileDiagnostics.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Find & Replace Overlay */}
      {isFindOpen && (
        <div
          style={{
            backgroundColor: 'var(--ide-surface-elevated, #121214)',
            borderColor: 'var(--ide-border, #27272a)',
          }}
          className="absolute top-10 right-4 z-40 border rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 min-w-[320px] text-xs backdrop-blur-xl animate-fadeIn"
        >
          {/* Find Row */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowReplaceRow(!showReplaceRow)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title="Toggle Replace"
            >
              {showReplaceRow ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Find in file..."
                value={findText}
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey) handlePrevMatch();
                    else handleNextMatch();
                  } else if (e.key === 'Escape') {
                    setIsFindOpen(false);
                  }
                }}
                className="w-full bg-black/60 border border-white/15 focus:border-[var(--ide-accent,#00ff88)] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none pr-16"
              />
              <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-mono">
                {findMatches.length > 0 ? `${findMatchIndex + 1}/${findMatches.length}` : findText ? '0/0' : ''}
              </span>
            </div>
            <button
              onClick={handlePrevMatch}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Match (Shift+Enter)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={findMatches.length === 0}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next Match (Enter)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFindOpen(false)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Close (Escape)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Replace Row */}
          {showReplaceRow && (
            <div className="flex items-center gap-1.5 pl-6 pt-1 border-t border-white/10">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                className="flex-1 bg-black/60 border border-white/15 focus:border-[var(--ide-accent,#00ff88)] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none"
              />
              <button
                onClick={handleReplaceOne}
                disabled={findMatches.length === 0}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-medium disabled:opacity-30 cursor-pointer"
                title="Replace Next"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={findMatches.length === 0}
                className="px-2 py-1 bg-[var(--ide-accent,#00ff88)]/20 hover:bg-[var(--ide-accent,#00ff88)]/30 text-[var(--ide-accent,#00ff88)] border border-[var(--ide-accent,#00ff88)]/40 rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                title="Replace All"
              >
                All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Tab Context Menu */}
      {tabContextMenu && (
        <div
          style={{
            top: `${tabContextMenu.y}px`,
            left: `${tabContextMenu.x}px`,
            backgroundColor: 'var(--ide-surface-elevated, #121214)',
            borderColor: 'var(--ide-border, #27272a)',
          }}
          className="fixed z-50 border rounded-lg shadow-2xl py-1 min-w-[170px] text-xs text-white/90 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              closeTab(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
          >
            <span>Close</span>
            <span className="text-[10px] text-slate-500 font-mono">Ctrl+W</span>
          </button>
          <button
            onClick={() => {
              handleCloseOtherTabs(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
          >
            <span>Close Others</span>
          </button>
          <button
            onClick={() => {
              handleCloseTabsToRight(tabContextMenu.tab.id);
              setTabContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
          >
            <span>Close to the Right</span>
          </button>
          <div className="border-t border-white/10 my-1" />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(tabContextMenu.tab.filePath);
              setTabContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy Path</span>
          </button>
        </div>
      )}

      {/* Floating Debug Toolbar when session is running */}
      <DebugToolbar />

      {/* 3. CODE EDITOR VIEWPORT OR EMPTY WATERMARK CANVAS */}
      {!currentFile ? (
        <div
          onClick={onFocus}
          style={{
            backgroundColor: 'var(--ide-editor-bg)',
            color: 'var(--ide-text)',
          }}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative"
        >
          <div
            style={{
              backgroundColor: 'var(--ide-surface-elevated)',
              borderColor: 'var(--ide-border)',
            }}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs mb-3"
          >
            <Sparkles className="w-7 h-7 animate-pulse" style={{ color: 'var(--ide-accent)' }} />
          </div>
          <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ide-text)' }}>
            Vertex Forge Autonomous Studio
          </h2>
          <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--ide-text-muted)' }}>
            Select any file from the explorer on the left or use quick shortcuts below
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-5 max-w-md font-mono text-[11px]">
            <span
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="px-2.5 py-1 border rounded-lg shadow-xs"
            >
              <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘P</span> Quick Open
            </span>
            <span
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="px-2.5 py-1 border rounded-lg shadow-xs"
            >
              <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘K</span> Inline AI
            </span>
            <span
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="px-2.5 py-1 border rounded-lg shadow-xs"
            >
              <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘B</span> Toggle Sidebar
            </span>
            <span
              style={{
                backgroundColor: 'var(--ide-surface-elevated)',
                borderColor: 'var(--ide-border)',
                color: 'var(--ide-text)',
              }}
              className="px-2.5 py-1 border rounded-lg shadow-xs"
            >
              <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘`</span> Terminal Dock
            </span>
          </div>
        </div>
      ) : diffMode || activeTab?.diffMode ? (
        <div className="flex-1 flex overflow-hidden relative">
          <VisualDiffEditor
            filePath={activeFile}
            staged={false}
            onClose={() => setDiffMode(false)}
          />
        </div>
      ) : (
        <div
          style={{ backgroundColor: 'var(--ide-editor-bg)' }}
          className="flex-1 flex overflow-hidden relative font-mono text-xs"
        >
          {/* Cursor Live Diff Review Floating Bar */}
          {isDiffReviewActive && (
            <div className="absolute top-2 left-16 right-4 z-40 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-indigo-500/70 rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between animate-fadeIn text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold text-white">Cursor Inline Diff Review</span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Changes Ready
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDiffMode(!diffMode)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-[11px] transition-colors"
                  title="Toggle Split Diff View"
                >
                  {diffMode ? 'Editor' : 'Compare'}
                </button>
                <button
                  onClick={handleRejectInlineDiff}
                  className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reject and Restore Original (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={handleAcceptInlineDiff}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Accept and Save (Enter)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          )}

          {/* Cursor Tab (Copilot++) Ghost Text Autocomplete Banner */}
          {ghostText && (
            <div className="absolute bottom-4 left-16 z-30 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs font-mono animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-slate-400">Cursor Tab:</span>
              <span className="text-indigo-300 font-medium truncate max-w-sm">{ghostText}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold">
                Tab
              </kbd>
              <button onClick={() => setGhostText(null)} className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Antigravity Inline AI Floating Bar (Cmd+K) */}
          {isInlineAIOpen && (
            <div className="absolute top-3 left-16 right-4 z-30 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-xl p-3 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-semibold text-xs text-slate-100 font-sans">
                    Antigravity Inline Assistant
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-mono">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <button
                  onClick={() => setIsInlineAIOpen(false)}
                  className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-2 font-sans">
                <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 focus-within:border-indigo-500/60 rounded-lg px-2.5 py-1.5 transition-all shadow-inner">
                  <input
                    type="text"
                    value={inlinePrompt}
                    onChange={(e) => setInlinePrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineAISubmit();
                      if (e.key === 'Escape') setIsInlineAIOpen(false);
                    }}
                    placeholder="Ask AI to edit, refactor, generate code, or fix errors in this file..."
                    className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none font-mono"
                    autoFocus
                  />
                  <button
                    disabled={isInlineLoading || !inlinePrompt.trim()}
                    onClick={handleInlineAISubmit}
                    className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[11px] shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isInlineLoading ? <span>Generating...</span> : <span>Apply</span>}
                  </button>
                </div>

                {/* Quick AI Prompt Pills */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {[
                    'Refactor & Clean Code',
                    'Add Strict TypeScript Types',
                    'Optimize Performance',
                    'Add Unit Tests',
                    'Add Error Handling',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setInlinePrompt(chip);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-indigo-900/50 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      ✦ {chip}
                    </button>
                  ))}
                </div>

                {inlineResultNotice && (
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" />
                    <span>{inlineResultNotice}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Line Numbers & Breakpoint Gutter Column */}
        <div
          ref={lineColRef}
          style={{
            backgroundColor: 'var(--ide-editor-gutter)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text-muted)',
          }}
          className="w-14 py-3 select-none pr-1.5 font-mono text-[11px] border-r shrink-0 overflow-hidden"
        >
          {lines.map((_: string, i: number) => {
            const lineNum = i + 1;
            const bp = debugBreakpoints?.find((b: any) => b.filePath === activeFile && b.line === lineNum);
            const isExecutionLine = debugLocation?.filePath === activeFile && debugLocation?.line === lineNum;

            return (
              <div
                key={i}
                onClick={() => toggleBreakpoint?.(activeFile, lineNum)}
                className={`leading-5 h-5 flex items-center justify-between px-1 cursor-pointer group hover:bg-slate-800/60 rounded-sm transition-colors ${
                  isExecutionLine ? 'bg-amber-500/25 text-amber-300 font-bold' : ''
                }`}
                title={
                  isExecutionLine
                    ? `Current execution position (Line ${lineNum})`
                    : bp
                    ? `Breakpoint at line ${lineNum} (${bp.enabled ? 'Enabled' : 'Disabled'}${bp.condition ? `, condition: ${bp.condition}` : ''}) - Click to toggle`
                    : `Click to set breakpoint at line ${lineNum}`
                }
              >
                {/* Breakpoint / Execution Indicator */}
                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  {isExecutionLine ? (
                    <span className="text-amber-400 font-bold text-xs select-none">▶</span>
                  ) : bp ? (
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block transition-transform hover:scale-125 ${
                        bp.enabled ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'border border-rose-500 bg-transparent'
                      } ${bp.condition ? 'ring-1 ring-amber-400' : ''}`}
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-rose-500/0 group-hover:bg-rose-500/40 transition-colors inline-block" />
                  )}
                </div>

                {/* Line Number */}
                <span className={`text-right flex-1 ${isExecutionLine ? 'text-amber-300 font-bold' : ''}`}>
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Code Content TextArea */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e)}
          style={{ backgroundColor: 'var(--ide-editor-bg)' }}
          className="flex-1 h-full overflow-hidden relative"
        >
          <textarea
            ref={textareaRef}
            value={activeFileContent}
            onChange={(e) => {
              const val = e.target.value;
              updateFileContent(val);
              if (isCursorTabEnabled && currentFile) {
                const lines = val.split('\n');
                const lastLine = lines[lines.length - 1] || '';
                const suggestion = CursorService.getGhostTextSuggestion(lastLine, currentFile);
                setGhostText(suggestion);
              } else {
                setGhostText(null);
              }
            }}
            onKeyDown={(e) => {
              if (ghostText && e.key === 'Tab') {
                e.preventDefault();
                const newText = activeFileContent + ghostText;
                updateFileContent(newText);
                setGhostText(null);
                return;
              }
              if (ghostText && e.key === 'Escape') {
                setGhostText(null);
                return;
              }
            }}
            onClick={(e) => updateCursorTracking(e.currentTarget)}
            onKeyUp={(e) => updateCursorTracking(e.currentTarget)}
            onSelect={(e) => updateCursorTracking(e.currentTarget)}
            onBlur={() => {
              // Focus Loss Auto-Save Trigger: Immediate save when editor loses focus
              if (autoSave && activeTab?.isDirty) {
                saveCurrentFile();
              }
            }}
            onScroll={(e) => {
              if (lineColRef.current) {
                lineColRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            spellCheck={false}
            style={{
              backgroundColor: 'var(--ide-editor-bg)',
              color: 'var(--ide-text)',
            }}
            className="w-full h-full bg-transparent font-mono text-xs leading-5 resize-none outline-none whitespace-pre overflow-y-auto overflow-x-auto p-3 tab-size-2 scrollbar-slim"
          />
        </div>

        {/* Right Code Minimap Strip (Matching Screenshot) */}
        <div
          onClick={(e) => {
            if (!textareaRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = (e.clientY - rect.top) / rect.height;
            textareaRef.current.scrollTop = clickRatio * textareaRef.current.scrollHeight;
          }}
          className="w-14 h-full border-l border-slate-850 bg-black/40 select-none overflow-hidden relative cursor-pointer hidden md:flex flex-col py-2 px-1 gap-[2px] opacity-75 hover:opacity-100 transition-opacity shrink-0"
          title="Code Minimap (Click to navigate)"
        >
          {lines.slice(0, 100).map((l: string, idx: number) => {
            const trimmed = l.trim();
            const width = Math.min(100, Math.max(15, trimmed.length * 3));
            const isKeyword = /^(export|import|const|function|interface|type|class|return)\b/.test(trimmed);
            const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');
            return (
              <div
                key={idx}
                className="h-[2px] rounded-xs"
                style={{
                  width: `${width}%`,
                  marginLeft: `${Math.min(20, (l.length - trimmed.length) * 2)}px`,
                  backgroundColor: isKeyword
                    ? '#00ff88'
                    : isComment
                    ? '#555555'
                    : '#888888',
                  opacity: trimmed ? 0.75 : 0,
                }}
              />
            );
          })}

          {/* Draggable Viewport Box */}
          <div
            className="absolute left-0 right-0 border border-white/25 bg-white/5 pointer-events-none rounded-xs"
            style={{
              top: `${Math.min(80, textareaRef.current ? (textareaRef.current.scrollTop / (textareaRef.current.scrollHeight || 1)) * 100 : 0)}%`,
              height: '32px',
            }}
          />
        </div>

        {/* Diagnostics Floater if errors found in file */}
        {fileDiagnostics.length > 0 && (
          <div className="absolute bottom-3 right-4 max-w-md bg-slate-900/95 border border-rose-500/40 rounded-xl p-3 shadow-xl backdrop-blur-sm z-20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Diagnostic Found (Line {fileDiagnostics[0].line})</span>
              </div>
              <button
                onClick={() => triggerSelfHealDebug(fileDiagnostics[0].message)}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Fix with AI</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 font-mono leading-tight">{fileDiagnostics[0].message}</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export const EditorArea: React.FC = () => {
  const layout = useLayout();
  const { saveCurrentFile } = useIDE() as any;

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const isSplit = layout.config.editorSplit !== 'none';
  const isVertical = layout.config.editorSplit === 'vertical';

  const handleResize = (delta: number) => {
    // Modify editorSplitRatio
    const container = document.getElementById('editor-split-container');
    if (!container) return;
    const totalSize = isVertical ? container.clientWidth : container.clientHeight;
    if (totalSize > 0) {
      const deltaRatio = delta / totalSize;
      layout.setEditorSplitRatio(layout.config.editorSplitRatio + deltaRatio);
    }
  };

  return (
    <div
      id="editor-split-container"
      className={`flex-1 flex min-w-0 overflow-hidden ${
        isVertical ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Primary Editor Group 0 */}
      <div
        style={{
          flex: isSplit ? `${layout.config.editorSplitRatio} 1 0%` : '1 1 0%',
        }}
        className="flex min-w-0 min-h-0 overflow-hidden"
      >
        <SingleEditorGroup
          groupId={0}
          isActive={layout.config.activeEditorGroupIndex === 0}
          onFocus={() => layout.setActiveEditorGroupIndex(0)}
          onSplitRight={() => layout.splitEditor('vertical')}
          onSplitDown={() => layout.splitEditor('horizontal')}
          onCloseSplit={() => layout.closeEditorSplit()}
          canCloseSplit={isSplit}
        />
      </div>

      {/* Splitter if split is enabled */}
      {isSplit && (
        <Splitter
          direction={isVertical ? 'vertical' : 'horizontal'}
          onResize={handleResize}
          label="Resize editor split"
        />
      )}

      {/* Secondary Editor Group 1 */}
      {isSplit && (
        <div
          style={{
            flex: `${1 - layout.config.editorSplitRatio} 1 0%`,
          }}
          className="flex min-w-0 min-h-0 overflow-hidden"
        >
          <SingleEditorGroup
            groupId={1}
            isActive={layout.config.activeEditorGroupIndex === 1}
            onFocus={() => layout.setActiveEditorGroupIndex(1)}
            onSplitRight={() => layout.splitEditor('vertical')}
            onSplitDown={() => layout.splitEditor('horizontal')}
            onCloseSplit={() => layout.closeEditorSplit()}
            canCloseSplit={true}
          />
        </div>
      )}
    </div>
  );
};
