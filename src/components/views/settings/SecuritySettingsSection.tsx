import React from 'react';

interface SecuritySettingsSectionProps {
  protectEnvFiles: boolean;
  setProtectEnvFiles: (protect: boolean) => void;
  terminalTimeout: number;
  setTerminalTimeout: (timeout: number) => void;
  isTerminalSection?: boolean;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  protectEnvFiles,
  setProtectEnvFiles,
  terminalTimeout,
  setTerminalTimeout,
  isTerminalSection = false,
}) => {
  if (isTerminalSection) {
    return (
      <div className="flex flex-col gap-5 text-xs">
        <div style={{ borderColor: 'var(--ide-border)' }} className="border-b pb-3">
          <h3 className="text-sm font-bold text-white">Terminal & Command Execution</h3>
          <p className="text-[11px] text-slate-400">Manage process sandboxing and execution timeout budgets.</p>
        </div>

        <div className="flex flex-col gap-2 max-w-xs">
          <label className="font-semibold text-slate-300">Execution Timeout: {terminalTimeout} seconds</label>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={terminalTimeout}
            onChange={e => setTerminalTimeout(Number(e.target.value))}
            className="accent-indigo-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400">Commands exceeding this threshold will be safely cancelled.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs">
      <div style={{ borderColor: 'var(--ide-border)' }} className="border-b pb-3">
        <h3 className="text-sm font-bold text-white">Security & Workspace Isolation</h3>
        <p className="text-[11px] text-slate-400">Hardened desktop safeguards preventing path traversal and secret leakage.</p>
      </div>

      <label className="flex items-center gap-3 text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={protectEnvFiles}
          onChange={e => setProtectEnvFiles(e.target.checked)}
          className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
        />
        <div>
          <span className="font-bold block">Protect Sensitive Environment Files (.env, .git)</span>
          <span className="text-[10px] text-slate-400">Blocks automated AI overwrites to secret credentials without explicit confirmation.</span>
        </div>
      </label>

      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex flex-col gap-1">
        <span className="font-bold">Electron Context Isolation: Active</span>
        <span className="text-[10px] text-slate-300 leading-snug">
          Renderer process operates with zero direct Node.js access; all filesystem calls routed through typed preload IPC with workspace path boundary checks.
        </span>
      </div>
    </div>
  );
};
