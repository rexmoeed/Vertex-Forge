import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { PrivacySettings } from '../../../types/aiProviders';

export interface PrivacyTabProps {
  privacy: PrivacySettings;
  onUpdatePrivacy: (key: keyof PrivacySettings, val: boolean) => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({ privacy, onUpdatePrivacy }) => {
  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Data Privacy & Zero-Retention Gates</h2>
        <p className="text-xs text-slate-400">
          Ensure source code and secrets never leak to public model training datasets.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero Data Retention Mode</span>
            </h3>
            <p className="text-[11px] text-slate-400">Instruct supported providers not to store prompts or outputs.</p>
          </div>
          <input
            type="checkbox"
            checked={privacy.zeroDataRetention}
            onChange={e => onUpdatePrivacy('zeroDataRetention', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strip Sensitive Env Variables</span>
            </h3>
            <p className="text-[11px] text-slate-400">Automatically filter API keys and secrets before sending prompts.</p>
          </div>
          <input
            type="checkbox"
            checked={privacy.maskSensitiveData}
            onChange={e => onUpdatePrivacy('maskSensitiveData', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
