import React from 'react';
import {
  X,
  Sparkles,
  Columns,
  Rows,
  SplitSquareVertical,
  Save,
  Copy,
  Check,
  Search,
} from 'lucide-react';

export interface OpenTab {
  id: string;
  filePath: string;
  title: string;
  isDirty?: boolean;
}

export interface EditorTabBarProps {
  openTabs: OpenTab[];
  activeTabId: string | null;
  openFile: (path: string) => void;
  closeTab: (id: string) => void;
  setTabContextMenu: (menu: any) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, path?: string) => void;
  getFileIcon: (path: string) => React.ReactNode;
  isInlineAIOpen: boolean;
  setIsInlineAIOpen: (open: boolean) => void;
  isCursorTabEnabled: boolean;
  setIsCursorTabEnabled: (enabled: boolean) => void;
  onSplitRight: () => void;
  onSplitDown: () => void;
  canCloseSplit: boolean;
  onCloseSplit: () => void;
  activeFile: string | null;
  diffMode: boolean;
  setDiffMode: (mode: boolean) => void;
  currentDiff?: { additions: number; deletions: number } | null;
  autoSave: boolean;
  isAutoSaving: boolean;
  activeTab?: OpenTab | null;
  saveCurrentFile: () => void;
  handleCopyCode: () => void;
  copied: boolean;
  isFindOpen: boolean;
  setIsFindOpen: (open: boolean) => void;
}

export const EditorTabBar: React.FC<EditorTabBarProps> = ({
  openTabs,
  activeTabId,
  openFile,
  closeTab,
  setTabContextMenu,
  handleDragOver,
  handleDrop,
  getFileIcon,
  isInlineAIOpen,
  setIsInlineAIOpen,
  isCursorTabEnabled,
  setIsCursorTabEnabled,
  onSplitRight,
  onSplitDown,
  canCloseSplit,
  onCloseSplit,
  activeFile,
  diffMode,
  setDiffMode,
  currentDiff,
  autoSave,
  isAutoSaving,
  activeTab,
  saveCurrentFile,
  handleCopyCode,
  copied,
  isFindOpen,
  setIsFindOpen,
}) => {
  return (
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
          title="Split Editor Right (Cmd+\\)"
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

        {/* Visual Side-by-Side Diff Toggle */}
        {activeFile && (
          <button
            onClick={() => setDiffMode(!diffMode)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
              diffMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-600/10 hover:text-indigo-400 dark:hover:border-indigo-500/50'
            }`}
            title={diffMode ? 'Return to Code Editor' : 'Open Visual Side-by-Side Diff against Git HEAD'}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentDiff ? `+${currentDiff.additions} -${currentDiff.deletions}` : 'Side-by-Side Diff'}</span>
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
  );
};
