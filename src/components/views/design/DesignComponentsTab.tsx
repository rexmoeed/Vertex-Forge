import React from 'react';
import { ThemeDefinition } from '../../../types/theme';

interface DesignComponentsTabProps {
  activeTheme: ThemeDefinition;
}

export const DesignComponentsTab: React.FC<DesignComponentsTabProps> = ({ activeTheme }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
          Button Component State Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Primary (Action)</span>
            <button
              style={{ backgroundColor: activeTheme.colors.accent }}
              className="px-4 py-2 hover:opacity-90 text-white rounded-lg font-bold shadow-md cursor-pointer transition-opacity"
            >
              Primary Action
            </button>
            <button disabled className="px-4 py-2 bg-indigo-600/40 text-white/50 rounded-lg font-bold cursor-not-allowed">
              Primary Disabled
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Secondary (Neutral)</span>
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-lg font-medium cursor-pointer transition-colors">
              Secondary Action
            </button>
            <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800 rounded-lg font-medium cursor-not-allowed">
              Secondary Disabled
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Danger (Destructive)</span>
            <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold cursor-pointer transition-colors">
              Delete File
            </button>
            <button disabled className="px-4 py-2 bg-rose-900/30 text-rose-300/40 rounded-lg font-bold cursor-not-allowed">
              Delete Disabled
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Ghost / Outline</span>
            <button className="px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer transition-colors">
              Ghost Action
            </button>
            <button disabled className="px-4 py-2 text-slate-400 dark:text-slate-600 rounded-lg font-medium cursor-not-allowed">
              Ghost Disabled
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
          Form Input & Validation States
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Default Input</label>
            <input
              type="text"
              placeholder="Task title..."
              defaultValue="Implement OAuth2 Token Refresh"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Validated Input (Success)</label>
            <input
              type="text"
              defaultValue="https://api.domain.io/v2"
              className="bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Endpoint syntax verified</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Invalid Input (Error)</label>
            <input
              type="text"
              defaultValue="../../etc/shadow"
              className="bg-slate-50 dark:bg-slate-950 border border-rose-500 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Path traversal rejected by security policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
