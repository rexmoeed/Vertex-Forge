import React from 'react';
import { PrivacySettings } from '../../../types/aiProvider';

export interface PrivacyTabProps {
  privacySettings: PrivacySettings;
  onPrivacyChange: (updates: Partial<PrivacySettings>) => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({
  privacySettings,
  onPrivacyChange,
}) => {
  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Privacy & Project Data Control</h2>
        <p className="text-xs text-slate-400">
          Configure explicit data boundaries before source code or terminal outputs are shared with LLMs.
        </p>
      </div>

      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white">Exclude .env & Secret Credential Files</h4>
            <p className="text-[11px] text-slate-400">
              Guarantees that files named .env, .pem, .key, id_rsa are automatically blocked from LLM context.
            </p>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.excludeEnvSecrets}
            onChange={e => onPrivacyChange({ excludeEnvSecrets: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white">Allow Source Code Context Transmission</h4>
            <p className="text-[11px] text-slate-400">
              Permits sending relevant workspace code snippets to the user-selected LLM provider for editing.
            </p>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.allowSendSourceCode}
            onChange={e => onPrivacyChange({ allowSendSourceCode: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white">Allow Sharing Terminal Errors with AI</h4>
            <p className="text-[11px] text-slate-400">
              Enables the 'Send to AI Assistant' button in the terminal to transmit stack traces for debugging.
            </p>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.allowShareTerminalOutput}
            onChange={e => onPrivacyChange({ allowShareTerminalOutput: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-xs font-bold text-white">Max Cost Limit Per Session ($ USD)</h4>
            <p className="text-[11px] text-slate-400">
              Hard stop budget to prevent runaway agent loops or infinite tool calling.
            </p>
          </div>
          <input
            type="number"
            value={privacySettings.maxCostPerSessionUsd}
            onChange={e => onPrivacyChange({ maxCostPerSessionUsd: Number(e.target.value) })}
            className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
          />
        </div>
      </div>
    </div>
  );
};
