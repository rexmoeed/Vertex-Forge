import React from 'react';
import { FileX } from 'lucide-react';

export interface GitIgnoreTabProps {
  onAddPreset: (preset: 'node' | 'python' | 'rust' | 'general') => Promise<void>;
}

export const GitIgnoreTab: React.FC<GitIgnoreTabProps> = ({ onAddPreset }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
        <FileX className="w-4 h-4" />
        <span>Ignore-File Assistant</span>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Quickly populate your <code className="text-slate-200">.gitignore</code> file with industry-standard rules for common environments.
      </p>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          onClick={() => onAddPreset('node')}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
        >
          <span className="font-bold text-slate-200">Node & npm</span>
          <span className="text-[10px] text-slate-400 font-mono">node_modules/, *.log</span>
        </button>

        <button
          onClick={() => onAddPreset('python')}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
        >
          <span className="font-bold text-slate-200">Python</span>
          <span className="text-[10px] text-slate-400 font-mono">__pycache__/, *.pyc, .venv</span>
        </button>

        <button
          onClick={() => onAddPreset('rust')}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
        >
          <span className="font-bold text-slate-200">Rust & Cargo</span>
          <span className="text-[10px] text-slate-400 font-mono">target/, Cargo.lock</span>
        </button>

        <button
          onClick={() => onAddPreset('general')}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left flex flex-col gap-1 transition-all"
        >
          <span className="font-bold text-slate-200">General OS</span>
          <span className="text-[10px] text-slate-400 font-mono">.DS_Store, Thumbs.db</span>
        </button>
      </div>
    </div>
  );
};
