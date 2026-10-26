import React from 'react';
import {
  Plus,
  Cpu,
  RotateCw,
  ExternalLink,
  Zap,
  Play,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ProviderConfig, ProviderId, ConnectionTestResult } from '../../../types/aiProvider';

export interface ConnectedTabProps {
  providers: ProviderConfig[];
  onGoToAddTab: () => void;
  isAutoDetecting: boolean;
  onAutoDetectLocalLLMs: () => void;
  autoDetectResult: { onlineCount: number; detectedModelsCount: number; message: string } | null;
  onUpdateProvider: (id: ProviderId, updates: Partial<ProviderConfig>) => void;
  onTestConnection: (id: ProviderId, testType?: 'auth' | 'generation' | 'streaming' | 'tools') => Promise<ConnectionTestResult>;
  isTestingConnection: boolean;
  diagnosticResult: ConnectionTestResult | null;
  diagnosticProvider: ProviderId;
  onDeleteProvider: (id: ProviderId) => void;
  showKeys: Record<string, boolean>;
  onToggleShowKey: (id: string) => void;
}

export const ConnectedTab: React.FC<ConnectedTabProps> = ({
  providers,
  onGoToAddTab,
  isAutoDetecting,
  onAutoDetectLocalLLMs,
  autoDetectResult,
  onUpdateProvider,
  onTestConnection,
  isTestingConnection,
  diagnosticResult,
  diagnosticProvider,
  onDeleteProvider,
  showKeys,
  onToggleShowKey,
}) => {
  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Configured AI Providers</h2>
          <p className="text-xs text-slate-400">
            Connect and toggle providers. The active orchestrator and specialist agents will use these credentials.
          </p>
        </div>
        <button
          onClick={onGoToAddTab}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect New Provider</span>
        </button>
      </div>

      {/* Local AI Auto-Discovery Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white">Local AI Auto-Discovery</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">100% Offline & Private</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Auto-detect Ollama (:11434) and LM Studio (:1234) models with zero manual configuration.
            </p>
          </div>
        </div>

        <button
          onClick={onAutoDetectLocalLLMs}
          disabled={isAutoDetecting}
          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoDetecting ? 'animate-spin' : ''}`} />
          <span>{isAutoDetecting ? 'Scanning...' : 'Scan Local Models'}</span>
        </button>
      </div>

      {autoDetectResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
            autoDetectResult.onlineCount > 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          {autoDetectResult.onlineCount > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{autoDetectResult.message}</span>
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(p => {
          const isKeyVisible = showKeys[p.id];
          return (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                p.enabled
                  ? 'bg-indigo-950/20 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                      {p.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {p.apiKey ? (isKeyVisible ? 'Configured & Active (Masked for Security)' : '••••••••••••••••') : 'No Key (Offline/Local)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.apiKey && (
                    <button
                      onClick={() => onToggleShowKey(p.id)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={isKeyVisible ? 'Hide Key' : 'Show Key'}
                    >
                      {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateProvider(p.id, { enabled: !p.enabled })}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      p.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        p.enabled ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onTestConnection(p.id)}
                  disabled={isTestingConnection}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Play className={`w-3 h-3 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {p.id !== 'gemini' && (
                  <button
                    onClick={() => onDeleteProvider(p.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Delete Provider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
