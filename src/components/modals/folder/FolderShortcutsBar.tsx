import React from 'react';
import { Monitor, Home, FileText, Download, ShieldCheck, HardDrive } from 'lucide-react';

interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  isRoot: boolean;
  breadcrumbs: Array<{ name: string; path: string }>;
  folders: Array<{ name: string; path: string; hasSubfolders: boolean }>;
  drives: string[];
  shortcuts: Array<{ name: string; path: string }>;
}

interface FolderShortcutsBarProps {
  data: BrowseResponse | null;
  currentPath: string;
  onSelectPath: (path: string) => void;
}

export const FolderShortcutsBar: React.FC<FolderShortcutsBarProps> = ({
  data,
  currentPath,
  onSelectPath,
}) => {
  return (
    <div
      style={{ borderColor: 'var(--ide-border, #27272a)' }}
      className="px-4 py-2 border-b flex flex-wrap items-center gap-1.5 bg-black/20 shrink-0"
    >
      {data?.shortcuts.map(s => {
        const isDesktop = s.name === 'Desktop';
        const isHome = s.name === 'Home';
        const isDocs = s.name === 'Documents';
        const isDownloads = s.name === 'Downloads';
        const isCur = s.name === 'Current Project';

        return (
          <button
            key={s.path}
            onClick={() => onSelectPath(s.path)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              currentPath === s.path
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title={s.path}
          >
            {isDesktop && <Monitor className="w-3 h-3 text-cyan-400" />}
            {isHome && <Home className="w-3 h-3 text-indigo-400" />}
            {isDocs && <FileText className="w-3 h-3 text-amber-400" />}
            {isDownloads && <Download className="w-3 h-3 text-emerald-400" />}
            {isCur && <ShieldCheck className="w-3 h-3 text-violet-400" />}
            <span>{s.name}</span>
          </button>
        );
      })}

      {/* Drives */}
      {data?.drives && data.drives.length > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          {data.drives.map(d => (
            <button
              key={d}
              onClick={() => onSelectPath(d)}
              className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              <HardDrive className="w-2.5 h-2.5 text-slate-400" />
              <span>{d}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
