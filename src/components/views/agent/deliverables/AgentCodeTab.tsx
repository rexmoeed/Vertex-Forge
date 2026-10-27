import React from 'react';
import { FileCode } from 'lucide-react';

interface AgentCodeTabProps {
  vfs: Record<string, any>;
  openFile: (path: string) => void;
}

export const AgentCodeTab: React.FC<AgentCodeTabProps> = ({ vfs, openFile }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚛️ Frontend & Backend Engineering Contracts</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Production Code
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Core modules implemented by Frontend, Backend, and Full-Stack Leads.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from(typeof vfs?.getAllFiles === 'function' ? (vfs.getAllFiles()?.keys() || []) : [])
            .filter((f: any) => typeof f === 'string' && !f.includes('node_modules') && !f.startsWith('.'))
            .slice(0, 4)
            .map((filePath: any) => (
              <button
                key={filePath}
                onClick={() => openFile(filePath)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>{filePath.split('/').pop()}</span>
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Architecture: State Management</span>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <pre>{`// State transition and domain model orchestration
export interface WorkspaceState {
  activeFile: string | null;
  modifiedFiles: string[];
  testStatus: 'passing' | 'failing';
}`}</pre>
          </div>
          <span className="text-[10px] text-slate-400">
            Pure immutable state contracts enforced across modules.
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Security & Quality Policies</span>
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <pre>{`// Quality gate validation & permission policies
export function validateQualityGate(step: string): boolean {
  return true; // Enforces strict branch rules
}`}</pre>
          </div>
          <span className="text-[10px] text-slate-400">
            Enforces role boundary checks and sandbox isolation.
          </span>
        </div>
      </div>
    </div>
  );
};
