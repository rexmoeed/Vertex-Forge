import { logger } from '../../../services/logger';
import React, { useEffect, useRef, useState } from 'react';
import { useIDE } from '../../../context/IDEContext';
import { EditorTabBar } from '../../editor/EditorTabBar';
import { FindReplaceOverlay } from '../../editor/FindReplaceOverlay';
import { X, FileCode, FileJson, FileText } from 'lucide-react';
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
import { TabContextMenu } from './TabContextMenu';
import { EditorBreadcrumbBar } from './EditorBreadcrumbBar';
import { EditorDiagnosticsFloater } from './EditorDiagnosticsFloater';
import { useEditorFindReplace } from './useEditorFindReplace';
import { useEditorInlineAI } from './useEditorInlineAI';

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

  // Cursor Inline AI & Ghost Text (Copilot++) Hook
  const {
    isInlineAIOpen,
    setIsInlineAIOpen,
    inlinePrompt,
    setInlinePrompt,
    isInlineLoading,
    inlineResultNotice,
    isDiffReviewActive,
    ghostText,
    setGhostText,
    isCursorTabEnabled,
    setIsCursorTabEnabled,
    handleInlineAISubmit,
    handleAcceptInlineDiff,
    handleRejectInlineDiff,
  } = useEditorInlineAI({
    activeFile,
    activeFileContent,
    updateFileContent,
    saveCurrentFile,
  });

  // Tab Context Menu State
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tab: OpenTab } | null>(null);

  // Find & Replace Hook
  const findReplace = useEditorFindReplace(activeFileContent, updateFileContent);

  useEffect(() => {
    const handleOutside = () => setTabContextMenu(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

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
      } catch (err: unknown) {
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
        } catch (err: unknown) {
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
      onDrop={e => handleDrop(e)}
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
        isFindOpen={findReplace.isFindOpen}
        setIsFindOpen={findReplace.setIsFindOpen}
      />

      {/* Breadcrumb Bar */}
      {currentFile && (
        <EditorBreadcrumbBar currentFile={currentFile} fileDiagnostics={fileDiagnostics} />
      )}

      {/* Find & Replace Overlay */}
      <FindReplaceOverlay
        isFindOpen={findReplace.isFindOpen}
        setIsFindOpen={findReplace.setIsFindOpen}
        findText={findReplace.findText}
        setFindText={findReplace.setFindText}
        replaceText={findReplace.replaceText}
        setReplaceText={findReplace.setReplaceText}
        findMatches={findReplace.findMatches}
        findMatchIndex={findReplace.findMatchIndex}
        handlePrevMatch={findReplace.handlePrevMatch}
        handleNextMatch={findReplace.handleNextMatch}
        handleReplaceOne={findReplace.handleReplaceOne}
        handleReplaceAll={findReplace.handleReplaceAll}
      />

      {/* Floating Tab Context Menu */}
      {tabContextMenu && (
        <TabContextMenu
          menu={tabContextMenu}
          onClose={() => setTabContextMenu(null)}
          onCloseTab={closeTab}
          onCloseOthers={handleCloseOtherTabs}
          onCloseToRight={handleCloseTabsToRight}
        />
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
            onDrop={e => handleDrop(e)}
            style={{ backgroundColor: 'var(--ide-editor-bg)' }}
            className="flex-1 h-full overflow-hidden relative"
          >
            <textarea
              ref={textareaRef}
              value={activeFileContent}
              onChange={e => {
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
              onKeyDown={e => {
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
              onClick={e => updateCursorTracking(e.currentTarget)}
              onKeyUp={e => updateCursorTracking(e.currentTarget)}
              onSelect={e => updateCursorTracking(e.currentTarget)}
              onBlur={() => {
                if (autoSave && activeTab?.isDirty) {
                  saveCurrentFile();
                }
              }}
              onScroll={e => {
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
            <EditorDiagnosticsFloater
              diagnostic={fileDiagnostics[0]}
              onFixWithAI={triggerSelfHealDebug}
            />
          )}
        </div>
      )}
    </div>
  );
};
