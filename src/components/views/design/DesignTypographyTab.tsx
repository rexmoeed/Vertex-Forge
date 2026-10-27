import React from 'react';

export const DesignTypographyTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-5 shadow-xs">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Display / Hero (22px)</span>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">Autonomous AI Software Engineering Studio</div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Heading 1 (18px)</span>
        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">Kanban Sprint Backlog & Team Orchestration</div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Body Text (13px)</span>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-2xl mt-1">
          Engineered with a secure Electron main-process sandbox, typed preload bridge, in-memory virtual filesystem, and real-time self-healing debuggers.
        </p>
      </div>

      <div>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">Monospace Code (12px)</span>
        <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-700 dark:text-indigo-300 mt-1">
          {`export function sortTasks(tasks: Task[]): Task[] {\n  return [...tasks].sort((a, b) => b.priority - a.priority);\n}`}
        </pre>
      </div>
    </div>
  );
};
