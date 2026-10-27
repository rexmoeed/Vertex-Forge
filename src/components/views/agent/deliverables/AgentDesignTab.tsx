import React from 'react';
import { Palette } from 'lucide-react';

interface AgentDesignTabProps {
  setActiveView?: (view: any) => void;
}

export const AgentDesignTab: React.FC<AgentDesignTabProps> = ({ setActiveView }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🎨 World-Class UI Designer Specifications</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Design System v2.0
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Enforces typographic hierarchy, balanced spatial composition, semantic tokens, and high-fidelity states.
          </p>
        </div>
        <button
          onClick={() => setActiveView?.('design-system')}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Open Full Design System Studio</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Color Palette Tokens */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Color System Tokens</span>
          <div className="flex flex-col gap-1.5 mt-1 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-600 shadow"></div>
                <span className="font-mono text-slate-200">brand-indigo</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">#6366f1</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-950 border border-slate-700"></div>
                <span className="font-mono text-slate-200">surface-canvas</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">#020617</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span className="font-mono text-slate-200">status-success</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">#10b981</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-rose-500"></div>
                <span className="font-mono text-slate-200">status-error</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">#f43f5e</span>
            </div>
          </div>
        </div>

        {/* Typography Scale */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Typography Scale</span>
          <div className="flex flex-col gap-2 mt-1">
            <div>
              <span className="text-[10px] text-slate-500 block">Display Title (20px, font-black)</span>
              <span className="text-base font-black text-white">Sprint Execution Hub</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Section Subhead (13px, font-bold)</span>
              <span className="text-xs font-bold text-slate-200">Task Priorities & Assignees</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Body / Code (11px, font-mono)</span>
              <span className="text-[11px] font-mono text-indigo-300">task.priority === 'urgent'</span>
            </div>
          </div>
        </div>

        {/* Spacing & Elevation */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spacing & Elevation</span>
          <div className="flex flex-col gap-1.5 mt-1 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span>Base Grid</span>
              <span className="font-mono text-indigo-400">4px rhythmic unit</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span>Card Radius</span>
              <span className="font-mono text-indigo-400">12px rounded-xl</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <span>Elevation Shadow</span>
              <span className="font-mono text-indigo-400">shadow-lg shadow-black/40</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Contrast Ratio</span>
              <span className="font-mono text-emerald-400 font-bold">14.8:1 (AAA Pass)</span>
            </div>
          </div>
        </div>

        {/* State Blueprint Matrix */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Component State Matrix</span>
          <div className="flex flex-col gap-1.5 mt-1 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
              <span>Empty State:</span>
              <span className="text-slate-400 font-medium">Hero illustration + CTA</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
              <span>Loading State:</span>
              <span className="text-cyan-400 font-medium">Pulse Skeletons</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
              <span>Error State:</span>
              <span className="text-rose-400 font-medium">Inline banner + Retry</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 text-slate-300 flex items-center justify-between">
              <span>Success State:</span>
              <span className="text-emerald-400 font-medium">Transient notification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
