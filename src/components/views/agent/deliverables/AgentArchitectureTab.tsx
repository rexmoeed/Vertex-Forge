import React from 'react';
import { FileCode } from 'lucide-react';

interface AgentArchitectureTabProps {
  openFile: (path: string) => void;
}

export const AgentArchitectureTab: React.FC<AgentArchitectureTabProps> = ({ openFile }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🏛️ Lead Software Architect System Blueprint</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Decomposition & Security
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            System boundaries, state lifecycle, API endpoints, and sandbox security controls.
          </p>
        </div>
        <button
          onClick={() => openFile('server.ts')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span>Inspect server.ts API</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Decomposition & Data Flow */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">System Decomposition</h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block">Layer 1: Desktop / Web Frontend</span>
              <span className="text-[11px] text-slate-400">React 19 SPA, Tailwind CSS v4, Monaco-grade editor, responsive layout.</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block">Layer 2: IPC & Virtual Filesystem</span>
              <span className="text-[11px] text-slate-400">Scoped node tree, git diff calculation, conflict-free file locks.</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="font-bold text-white block">Layer 3: Express Backend Gateway</span>
              <span className="text-[11px] text-slate-400">Server-side proxy routes for Gemini 3.8 Flash, code review & test execution.</span>
            </div>
          </div>
        </div>

        {/* API Contracts */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">API Contracts</h4>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">GET /api/tasks</span>
              <span className="text-slate-400 block text-[10px]">Returns list of tasks with priority & status</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-blue-400 font-bold">POST /api/tasks</span>
              <span className="text-slate-400 block text-[10px]">Payload: Task data + RBAC caller token</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold">POST /api/ai/plan</span>
              <span className="text-slate-400 block text-[10px]">Server-side proxy to Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        {/* Technology Rationale & Security */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Architecture Rationale & Security</h4>
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              <strong>Why React 19 + Express?</strong> Enables reactive client-side multi-tab workbench while keeping LLM secrets secure on the server.
            </p>
            <p>
              <strong>Path Traversal Defense:</strong> All file reads & writes are strictly validated to prevent directory escapes (`../..`).
            </p>
            <p>
              <strong>Protected Files:</strong> `.env` and `.git/` files require explicit human approval before modification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
