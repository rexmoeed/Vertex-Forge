import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { VirtualFileSystem } from '../../../services/virtualFs';

interface OutlineTimelineSectionProps {
  activeFile: string | null;
  activeFileContent?: string;
  vfs?: VirtualFileSystem | null;
  onOpenFile: (path: string) => void;
}

export const OutlineTimelineSection: React.FC<OutlineTimelineSectionProps> = ({
  activeFile,
  activeFileContent,
  vfs,
  onOpenFile,
}) => {
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Parse symbols from activeFileContent for Outline View
  const outlineSymbols = useMemo(() => {
    if (!activeFileContent) return [];
    const lines = activeFileContent.split('\n');
    const symbols: Array<{ name: string; type: 'interface' | 'type' | 'function' | 'class'; line: number }> = [];
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_]+)/);
      if (ifaceMatch) symbols.push({ name: ifaceMatch[1], type: 'interface', line: idx + 1 });
      const typeMatch = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z0-9_]+)/);
      if (typeMatch) symbols.push({ name: typeMatch[1], type: 'type', line: idx + 1 });
      const classMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)/);
      if (classMatch) symbols.push({ name: classMatch[1], type: 'class', line: idx + 1 });
      const fnMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
      if (fnMatch) symbols.push({ name: fnMatch[1], type: 'function', line: idx + 1 });
      const methodMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*\([^)]*\)\s*:/);
      if (methodMatch && !['constructor', 'if', 'for', 'switch'].includes(methodMatch[1])) {
        symbols.push({ name: methodMatch[1], type: 'function', line: idx + 1 });
      }
    });
    return symbols;
  }, [activeFileContent]);

  // Real commits from VFS / Git for Timeline View
  const displayCommits = useMemo(() => {
    const list = vfs?.getCommits?.() || [];
    if (list.length > 0) {
      return list.map((c: any) => ({
        hash: (c.hash || c.id || '').slice(0, 7),
        msg: c.message,
        time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        author: c.author || 'User',
      }));
    }
    return [
      { hash: 'HEAD', msg: 'Initial project baseline structure', time: 'Baseline', author: 'Vertex Forge' },
    ];
  }, [vfs]);

  return (
    <div className="border-t border-slate-800 flex flex-col text-xs select-none shrink-0">
      {/* Outline Header */}
      <div
        onClick={() => setIsOutlineOpen(!isOutlineOpen)}
        className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer text-slate-400 hover:text-slate-200 transition"
      >
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          {isOutlineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>Outline</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {outlineSymbols.length} Symbols
        </span>
      </div>

      {/* Outline Content */}
      {isOutlineOpen && (
        <div className="max-h-48 overflow-y-auto py-1 bg-slate-950/40">
          {outlineSymbols.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-500 italic">
              {activeFile ? 'No symbols found in active file' : 'No file currently open'}
            </div>
          ) : (
            outlineSymbols.map((sym, idx) => (
              <div
                key={idx}
                className="px-4 py-1 hover:bg-white/5 flex items-center justify-between text-[11px] text-slate-300 cursor-pointer"
                onClick={() => {
                  if (activeFile) onOpenFile(activeFile);
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    {sym.type[0]}
                  </span>
                  <span className="truncate">{sym.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  L{sym.line}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline Header */}
      <div
        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
        className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer text-slate-400 hover:text-slate-200 transition"
      >
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          {isTimelineOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>Timeline</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {displayCommits.length} Commits
        </span>
      </div>

      {/* Timeline Content */}
      {isTimelineOpen && (
        <div className="max-h-44 overflow-y-auto py-1 bg-slate-950/40">
          {displayCommits.map((cmt, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 hover:bg-white/5 flex flex-col gap-0.5 border-b border-slate-900 last:border-b-0 cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-indigo-400 font-bold">{cmt.hash}</span>
                <span className="text-[10px] text-slate-500">{cmt.time}</span>
              </div>
              <div className="text-[11px] text-slate-300 truncate">{cmt.msg}</div>
              <div className="text-[9px] text-slate-500">{cmt.author}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
