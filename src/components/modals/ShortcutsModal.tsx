import React, { useState, useEffect, useMemo } from 'react';
import { X, Keyboard, Search, Sparkles, Terminal, Bug, Compass, Layers } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  desc: string;
  category: 'ai' | 'nav' | 'exec' | 'debug';
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const shortcuts: ShortcutItem[] = useMemo(
    () => [
      { category: 'ai', key: 'Cmd/Ctrl + I', desc: 'Cursor Composer: multi-file generation with @ mentions' },
      { category: 'ai', key: 'Cmd/Ctrl + K', desc: 'Cursor Inline Edit: in-editor code generation & diff review' },
      { category: 'ai', key: 'Tab', desc: 'Cursor Tab: accept inline ghost text autocomplete prediction' },
      { category: 'ai', key: 'Cmd/Ctrl + K (Terminal)', desc: 'Terminal AI: synthesize shell commands from prompt' },
      { category: 'nav', key: 'Cmd/Ctrl + P', desc: 'Quick-open file across workspace' },
      { category: 'nav', key: 'Cmd/Ctrl + Shift + F', desc: 'Global codebase search (Grep)' },
      { category: 'exec', key: 'Cmd/Ctrl + S', desc: 'Save active file & trigger static analysis' },
      { category: 'exec', key: 'Cmd/Ctrl + Enter', desc: 'Execute autonomous task or send AI chat prompt' },
      { category: 'exec', key: 'Cmd/Ctrl + `', desc: 'Toggle integrated terminal & diagnostics dock' },
      { category: 'debug', key: 'Cmd/Ctrl + Shift + T', desc: 'Run all Vitest assertions & unit tests' },
      { category: 'debug', key: 'F5 / Shift + F5', desc: 'Start / Continue / Stop DAP Debugging' },
      { category: 'debug', key: 'F10 / F11', desc: 'Step Over / Step Into current statement' },
    ],
    []
  );

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;
    const q = searchQuery.toLowerCase();
    return shortcuts.filter(
      (s) => s.desc.toLowerCase().includes(q) || s.key.toLowerCase().includes(q)
    );
  }, [shortcuts, searchQuery]);

  if (!isOpen) return null;

  const categoryMeta = {
    ai: { label: 'AI & Copilot Intelligence', icon: Sparkles, color: 'text-amber-400' },
    nav: { label: 'Navigation & File Search', icon: Compass, color: 'text-sky-400' },
    exec: { label: 'Execution & Workspace', icon: Terminal, color: 'text-emerald-400' },
    debug: { label: 'Testing & DAP Debugging', icon: Bug, color: 'text-rose-400' },
  };

  const categories = (['ai', 'nav', 'exec', 'debug'] as const).filter((cat) =>
    filteredShortcuts.some((s) => s.category === cat)
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Vertex Forge Keyboard Shortcuts</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {shortcuts.length} keys
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Essential navigation, AI editing, and execution shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shortcuts by action or key (e.g. debug, tab, composer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable list of shortcuts */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Layers className="w-6 h-6 text-slate-500" />
              <span>No shortcuts found matching &ldquo;{searchQuery}&rdquo;</span>
            </div>
          ) : (
            categories.map((cat) => {
              const meta = categoryMeta[cat];
              const Icon = meta.icon;
              const catShortcuts = filteredShortcuts.filter((s) => s.category === cat);

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span>{meta.label}</span>
                  </div>
                  <div className="grid gap-1.5">
                    {catShortcuts.map((s, idx) => (
                      <div
                        key={`${cat}-${idx}`}
                        className="flex items-center justify-between gap-3 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/40 transition-colors"
                      >
                        <span className="text-xs text-slate-200 font-medium leading-tight">{s.desc}</span>
                        <kbd className="shrink-0 px-2.5 py-1 bg-slate-950/90 border border-slate-700/80 rounded-md text-[11px] font-mono font-semibold text-indigo-300 shadow-xs whitespace-nowrap">
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">Esc</kbd> or click outside to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
