import React from 'react';
import { Search, RotateCw } from 'lucide-react';
import { ProviderId, ModelInfo } from '../../../types/aiProvider';

export interface ModelCatalogTabProps {
  catalogQuery: string;
  setCatalogQuery: (q: string) => void;
  catalogProviderFilter: string;
  setCatalogProviderFilter: (p: ProviderId | 'all') => void;
  catalogCapabilityFilter: string;
  setCatalogCapabilityFilter: (c: 'all' | 'coding' | 'reasoning' | 'tool_calling' | 'fast' | 'vision') => void;
  filteredModels: ModelInfo[];
  handleRefreshCatalog: () => void;
  isRefreshingCatalog: boolean;
}

export const ModelCatalogTab: React.FC<ModelCatalogTabProps> = ({
  catalogQuery,
  setCatalogQuery,
  catalogProviderFilter,
  setCatalogProviderFilter,
  catalogCapabilityFilter,
  setCatalogCapabilityFilter,
  filteredModels,
  handleRefreshCatalog,
  isRefreshingCatalog,
}) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Model Catalog</h2>
          <p className="text-xs text-slate-400">
            Filter and inspect model capabilities (context size, reasoning, coding, vision, tool calling).
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={catalogQuery}
              onChange={e => setCatalogQuery(e.target.value)}
              placeholder="Search models..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          <select
            value={catalogProviderFilter}
            onChange={e => setCatalogProviderFilter(e.target.value as ProviderId | 'all')}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Providers</option>
            <option value="openrouter">OpenRouter (100+ Models)</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="mistral">Mistral</option>
            <option value="groq">Groq</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="lmstudio">LM Studio (Local)</option>
            <option value="custom">Custom OpenAI-Compatible</option>
          </select>

          <select
            value={catalogCapabilityFilter}
            onChange={e =>
              setCatalogCapabilityFilter(
                e.target.value as 'all' | 'coding' | 'reasoning' | 'tool_calling' | 'fast' | 'vision'
              )
            }
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Capabilities</option>
            <option value="coding">Coding Optimized</option>
            <option value="reasoning">Reasoning</option>
            <option value="tool_calling">Tool Calling</option>
            <option value="fast">Fast / High Concurrency</option>
            <option value="vision">Vision Capable</option>
          </select>

          <button
            onClick={handleRefreshCatalog}
            disabled={isRefreshingCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition cursor-pointer shadow-sm"
            title="Fetch latest models catalog from provider API"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingCatalog ? 'animate-spin' : ''}`} />
            <span>{isRefreshingCatalog ? 'Fetching...' : 'Refresh Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModels.map(m => (
          <div
            key={m.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{m.name}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded border border-slate-700">
                    {m.providerId}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {m.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{m.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Context:</span>
                <span className="font-mono text-slate-200">
                  {m.contextWindow >= 1000000
                    ? `${(m.contextWindow / 1000000).toFixed(1)}M`
                    : `${(m.contextWindow / 1000).toFixed(0)}k`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {m.supportsToolCalling && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                    Tools
                  </span>
                )}
                {m.isReasoning && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
                    Reasoning
                  </span>
                )}
                {m.supportsStreaming && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                    Stream
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
