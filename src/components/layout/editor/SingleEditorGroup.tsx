import { logger } from '../../../services/logger';
import React, { useEffect, useRef, useState } from 'react';
import { useIDE } from '../../../context/IDEContext';
import { EditorTabBar } from '../../editor/EditorTabBar';
import { FindReplaceOverlay } from '../../editor/FindReplaceOverlay';
import {
  X,
  AlertTriangle,
  Sparkles,
  FileCode,
  FileJson,
  FileText,
  Copy,
} from 'lucide-react';
import { OpenTab } from '../../../types/ide';
import { FILE_DRAG_MIME, FileDragPayload } from '../../../types/dragDrop';
import { DesktopBridge } from '../../../services/desktopBridge';
import { DebugToolbar } from '../../debug/DebugToolbar';
import { VisualDiffEditor } from '../../git/VisualDiffEditor';
import { CursorService } from '../../../services/cursorService';
import { EditorEmptyState } from './EditorEmptyState';
import { EditorDiffReviewBar } from './EditorDiffReviewBar';
import { EditorInlineAIBar } from './EditorInlineAIBar';
import { EditorGutter } from './EditorGutter';
import { EditorMinimap } from './EditorMinimap';

export interface SingleEditorGroupProps {
  groupId: number;
  isActive: boolean;
  onFocus: () => void;
  onSplitRight: () => void;
  onSplitDown: () => void;
  onCloseSplit: () => void;
  canCloseSplit: boolean;
}

export const SingleEditorGroup: React.FC<SingleEditorGroupProps> = ({
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
    debugBreakpoints,
    debugLocation,
    toggleBreakpoint,
    cursorPosition,
    setCursorPosition,
  } = useIDE();

  const [diffMode, setDiffMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineColRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll editor to line when cursorPosition changes programmatically
  useEffect(() => {
    if (!textareaRef.current || !cursorPosition?.line) return;
    const lineHeight = 20;
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
  const [findMatchIndex, setFindMatchIndex] = useState(0);

  useEffect(() => {
    const handleOutside = () => setTabContextMenu(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

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
      const synthesized = `// [Cursor Edit] ${inlinePrompt}\n` + activeFileContent;
      updateFileContent(synthesized);
      setIsDiffReviewActive(true);
      setIsInlineAIOpen(false);
    } catch (err: any) {
      logger.error('Inline AI error:', err);
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

  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(FILE_DRAG_MIME) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      dragCounterRef.current++;
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(FILE_DRAG_MIME) || e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
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
          }
          return;
        }
      } catch (err) {
        logger.error('[DragDrop] Failed to parse drag payload:', err);
      }
    }

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
          logger.error('[DragDrop] Failed to read external OS file:', err);
        }
      }
    }
  };

  const activeTab =
    openTabs.find((t: OpenTab) => t.id === activeTabId) ||
    (activeFile ? openTabs.find((t: OpenTab) => t.filePath === activeFile) : undefined) ||
    (openTabs.length > 0 ? openTabs[0] : undefined);

  const currentFile = activeTab?.filePath || activeFile;
  const currentDiff = currentFile ? modifiedFiles.find((m: any) => m.filePath === currentFile) : null;
  const lines = activeFileContent ? activeFileContent.split('\n') : [];
  const fileDiagnostics = currentFile ? problems.filter((p: any) => p.filePath === currentFile) : [];

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

      {/* Tab Bar */}
      <EditorTabBar
        openTabs={openTabs}
        activeTabId={activeTabId}
        openFile={openFile}
        closeTab={closeTab}
        setTabContextMenu={setTabContextMenu}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        getFileIcon={getFileIcon}
        isInlineAIOpen={isInlineAIOpen}
        setIsInlineAIOpen={setIsInlineAIOpen}
        isCursorTabEnabled={isCursorTabEnabled}
        setIsCursorTabEnabled={setIsCursorTabEnabled}
        onSplitRight={onSplitRight}
        onSplitDown={onSplitDown}
        canCloseSplit={canCloseSplit}
        onCloseSplit={onCloseSplit}
        activeFile={activeFile}
        diffMode={diffMode}
        setDiffMode={setDiffMode}
        currentDiff={currentDiff}
        autoSave={autoSave}
        isAutoSaving={isAutoSaving}
        activeTab={activeTab}
        saveCurrentFile={saveCurrentFile}
        handleCopyCode={handleCopyCode}
        copied={copied}
        isFindOpen={isFindOpen}
        setIsFindOpen={setIsFindOpen}
      />

      {/* Breadcrumb Bar */}
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

      {/* Find & Replace Overlay */}
      <FindReplaceOverlay
        isFindOpen={isFindOpen}
        setIsFindOpen={setIsFindOpen}
        findText={findText}
        setFindText={setFindText}
        replaceText={replaceText}
        setReplaceText={setReplaceText}
        findMatches={findMatches}
        findMatchIndex={findMatchIndex}
        handlePrevMatch={handlePrevMatch}
        handleNextMatch={handleNextMatch}
        handleReplaceOne={handleReplaceOne}
        handleReplaceAll={handleReplaceAll}
      />

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

      {/* Debug Toolbar */}
      <DebugToolbar />

      {/* Code Editor Viewport or Empty State */}
      {!currentFile ? (
        <EditorEmptyState onFocus={onFocus} />
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
          {/* Live Diff Review Floating Bar */}
          {isDiffReviewActive && (
            <EditorDiffReviewBar
              diffMode={diffMode}
              onToggleDiffMode={() => setDiffMode(!diffMode)}
              onReject={handleRejectInlineDiff}
              onAccept={handleAcceptInlineDiff}
            />
          )}

          {/* Ghost Text Autocomplete Banner */}
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

          {/* Inline AI Floating Bar */}
          {isInlineAIOpen && (
            <EditorInlineAIBar
              inlinePrompt={inlinePrompt}
              setInlinePrompt={setInlinePrompt}
              isInlineLoading={isInlineLoading}
              inlineResultNotice={inlineResultNotice}
              onSubmit={handleInlineAISubmit}
              onClose={() => setIsInlineAIOpen(false)}
            />
          )}

          {/* Gutter */}
          <EditorGutter
            lines={lines}
            activeFile={activeFile}
            debugBreakpoints={debugBreakpoints}
            debugLocation={debugLocation}
            toggleBreakpoint={toggleBreakpoint}
            gutterRef={lineColRef}
          />

          {/* TextArea */}
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
                  const l = val.split('\n');
                  const lastLine = l[l.length - 1] || '';
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

          {/* Minimap */}
          <EditorMinimap lines={lines} textareaRef={textareaRef} />

          {/* Diagnostics Floater */}
          {fileDiagnostics.length > 0 && (
            <div className="absolute bottom-3 right-4 max-w-md bg-slate-900/95 border border-rose-500/40 rounded-xl p-3 shadow-xl backdrop-blur-sm z-20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Diagnostic Found (Line {fileDiagnostics[0].line})</span>
                </div>
                <button
                  onClick={() => triggerSelfHealDebug(fileDiagnostics[0].message)}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow cursor-pointer"
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
