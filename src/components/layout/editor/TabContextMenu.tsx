import React from 'react';
import { Copy } from 'lucide-react';
import { OpenTab } from '../../../types/ide';

interface TabContextMenuProps {
  menu: { x: number; y: number; tab: OpenTab };
  onClose: () => void;
  onCloseTab: (tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseToRight: (tabId: string) => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  menu,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseToRight,
}) => {
  return (
    <div
      style={{
        top: `${menu.y}px`,
        left: `${menu.x}px`,
        backgroundColor: 'var(--ide-surface-elevated, #121214)',
        borderColor: 'var(--ide-border, #27272a)',
      }}
      className="fixed z-50 border rounded-lg shadow-2xl py-1 min-w-[170px] text-xs text-white/90 animate-fadeIn"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onCloseTab(menu.tab.id);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
      >
        <span>Close</span>
        <span className="text-[10px] text-slate-500 font-mono">Ctrl+W</span>
      </button>
      <button
        onClick={() => {
          onCloseOthers(menu.tab.id);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
      >
        <span>Close Others</span>
      </button>
      <button
        onClick={() => {
          onCloseToRight(menu.tab.id);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center justify-between cursor-pointer transition"
      >
        <span>Close to the Right</span>
      </button>
      <div className="border-t border-white/10 my-1" />
      <button
        onClick={() => {
          navigator.clipboard?.writeText(menu.tab.filePath);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-[var(--ide-accent,#00ff88)] flex items-center gap-2 cursor-pointer transition"
      >
        <Copy className="w-3.5 h-3.5 text-slate-400" />
        <span>Copy Path</span>
      </button>
    </div>
  );
};
