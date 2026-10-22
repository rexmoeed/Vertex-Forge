import React from 'react';
import {
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ProviderId, ConnectionTestResult } from '../../../types/aiProvider';
import { AIProviderService } from '../../../services/aiProviderService';

export interface AddProviderWizardTabProps {
  wizardStep: 1 | 2 | 3 | 4;
  setWizardStep: (step: 1 | 2 | 3 | 4) => void;
  selectedProviderToAdd: ProviderId;
  setSelectedProviderToAdd: (id: ProviderId) => void;
  apiKeyInput: string;
  setApiKeyInput: (key: string) => void;
  baseUrlInput: string;
  setBaseUrlInput: (url: string) => void;
  showKeyPlaintext: boolean;
  setShowKeyPlaintext: (show: boolean) => void;
  isTestingConnection: boolean;
  setIsTestingConnection: (testing: boolean) => void;
  wizardTestResult: ConnectionTestResult | null;
  setWizardTestResult: (res: ConnectionTestResult | null) => void;
  onSave: () => void;
}

export const AddProviderWizardTab: React.FC<AddProviderWizardTabProps> = ({
  wizardStep,
  setWizardStep,
  selectedProviderToAdd,
  setSelectedProviderToAdd,
  apiKeyInput,
  setApiKeyInput,
  baseUrlInput,
  setBaseUrlInput,
  showKeyPlaintext,
  setShowKeyPlaintext,
  isTestingConnection,
  setIsTestingConnection,
  wizardTestResult,
  setWizardTestResult,
  onSave,
}) => {
  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-white">Add or Connect LLM Provider (BYOK)</h2>
        <p className="text-xs text-slate-400">
          Connect your own API key to unlock Claude, OpenAI, or local inference models across the IDE.
        </p>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        {[
          { num: 1 as const, label: 'Select Provider' },
          { num: 2 as const, label: 'Credentials & URL' },
          { num: 3 as const, label: 'Test Connection' },
          { num: 4 as const, label: 'Confirm & Activate' },
        ].map(step => (
          <div key={step.num} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                wizardStep === step.num
                  ? 'bg-indigo-600 text-white'
                  : wizardStep > step.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {wizardStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
            </div>
            <span
              className={`text-xs ${
                wizardStep === step.num ? 'font-bold text-white' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Choose provider */}
      {wizardStep === 1 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300">Choose Provider to Connect:</span>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'anthropic' as ProviderId,
                name: 'Anthropic Claude',
                desc: 'Claude 3.7 Sonnet, 3.5 Sonnet & Haiku with tool calling',
              },
              {
                id: 'openai' as ProviderId,
                name: 'OpenAI',
                desc: 'GPT-4o, GPT-4o Mini, and o3-mini reasoning',
              },
              {
                id: 'custom' as ProviderId,
                name: 'OpenAI-Compatible Endpoint',
                desc: 'Groq, Together AI, DeepSeek, or OpenRouter',
              },
              {
                id: 'local' as ProviderId,
                name: 'Local Model Server',
                desc: 'Ollama or LM Studio running on localhost',
              },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setSelectedProviderToAdd(opt.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedProviderToAdd === opt.id
                    ? 'bg-indigo-600/10 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <h4 className="font-bold text-sm text-white">{opt.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setWizardStep(2)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span>Continue to Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Credentials */}
      {wizardStep === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-200">
              API Key for {selectedProviderToAdd.toUpperCase()}
            </label>
            <div className="relative">
              <input
                type={showKeyPlaintext ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={
                  selectedProviderToAdd === 'anthropic'
                    ? 'sk-ant-api03-...'
                    : selectedProviderToAdd === 'openai'
                    ? 'sk-proj-...'
                    : 'Enter API key or leave blank for local'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKeyPlaintext(!showKeyPlaintext)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showKeyPlaintext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Credentials are kept in-memory and masked in UI. Never committed to Git.
            </span>
          </div>

          {(selectedProviderToAdd === 'custom' || selectedProviderToAdd === 'local') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-200">API Base URL</label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={e => setBaseUrlInput(e.target.value)}
                placeholder={
                  selectedProviderToAdd === 'local'
                    ? 'http://localhost:11434/v1'
                    : 'https://api.deepseek.com/v1'
                }
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setWizardStep(1)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={async () => {
                setWizardStep(3);
                setIsTestingConnection(true);
                const res = await AIProviderService.testConnection(selectedProviderToAdd);
                setIsTestingConnection(false);
                setWizardTestResult(res);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <span>Verify Connection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Test connection */}
      {wizardStep === 3 && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Connection Diagnostics</span>
              {isTestingConnection ? (
                <span className="text-xs text-indigo-400 flex items-center gap-1 animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </span>
              ) : wizardTestResult?.success ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Check Notice
                </span>
              )}
            </div>

            <div className="text-xs font-mono p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              {isTestingConnection
                ? 'Sending diagnostic probe request...'
                : wizardTestResult?.message || 'Ready for test.'}
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setWizardStep(2)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setWizardStep(4)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <span>Proceed to Confirm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm and Activate */}
      {wizardStep === 4 && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-300">Ready to Activate Provider</h4>
              <p className="text-[11px] text-emerald-400/80">
                {selectedProviderToAdd.toUpperCase()} will be enabled as an active model provider across all IDE
                agents.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={() => setWizardStep(3)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
            >
              Activate Provider in Studio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
