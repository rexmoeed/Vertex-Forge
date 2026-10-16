import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Cpu,
  Globe,
  HardDrive,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  DollarSign,
  Lock,
  Layers,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Check,
  Zap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ProviderId,
  ProviderConfig,
  ModelInfo,
  RoleModelAssignments,
  AgentModelOverride,
  UsageRecord,
  PrivacySettings,
  ConnectionTestResult,
  ModelCapability,
} from '../../types/aiProvider';
import { AIProviderService } from '../../services/aiProviderService';
import { LocalLLMService } from '../../services/localLLMService';

export const AIProviderHubView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'connected' | 'add' | 'catalog' | 'defaults' | 'agents' | 'usage' | 'privacy' | 'diagnostics'
  >('connected');

  // Core Service States
  const [providers, setProviders] = useState<ProviderConfig[]>(() => AIProviderService.loadProviders());
  const [roleAssignments, setRoleAssignments] = useState<RoleModelAssignments>(() =>
    AIProviderService.loadRoleAssignments()
  );
  const [agentOverrides, setAgentOverrides] = useState<Record<string, AgentModelOverride>>(() =>
    AIProviderService.loadAgentOverrides()
  );
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>(() => AIProviderService.loadUsageHistory());
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() =>
    AIProviderService.loadPrivacySettings()
  );

  // Add Provider Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProviderToAdd, setSelectedProviderToAdd] = useState<ProviderId>('anthropic');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [showKeyPlaintext, setShowKeyPlaintext] = useState(false);
  const [wizardTestResult, setWizardTestResult] = useState<ConnectionTestResult | null>(null);

  // Local AI Auto-Detection State
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectResult, setAutoDetectResult] = useState<{
    onlineCount: number;
    detectedModelsCount: number;
    message: string;
  } | null>(null);

  const handleAutoDetectLocal = async () => {
    setIsAutoDetecting(true);
    setAutoDetectResult(null);
    try {
      const res = await LocalLLMService.autoDetectAllEndpoints();
      if (res.onlineCount > 0) {
        setAutoDetectResult({
          onlineCount: res.onlineCount,
          detectedModelsCount: res.detectedModelsCount,
          message: `Success: Detected ${res.onlineCount} local server(s) with ${res.detectedModelsCount} model(s) ready for 100% offline inference.`,
        });
        setProviders(AIProviderService.loadProviders());
      } else {
        setAutoDetectResult({
          onlineCount: 0,
          detectedModelsCount: 0,
          message: 'No active local LLMs found on localhost:11434 (Ollama) or localhost:1234 (LM Studio). Start Ollama or LM Studio and scan again.',
        });
      }
    } catch {
      setAutoDetectResult({
        onlineCount: 0,
        detectedModelsCount: 0,
        message: 'Scan completed. Make sure Ollama or LM Studio is running.',
      });
    } finally {
      setIsAutoDetecting(false);
    }
  };
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Model Catalog Filter State
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogProviderFilter, setCatalogProviderFilter] = useState<ProviderId | 'all'>('all');
  const [catalogCapabilityFilter, setCatalogCapabilityFilter] = useState<ModelCapability | 'all'>('all');
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);

  const handleRefreshCatalog = async () => {
    setIsRefreshingCatalog(true);
    try {
      const targetProvider = catalogProviderFilter === 'all' ? 'openrouter' : catalogProviderFilter;
      const models = await AIProviderService.fetchDynamicModels(targetProvider);
      setProviders(AIProviderService.loadProviders());
      showToast(`Refreshed catalog: ${models.length} models loaded.`);
    } catch (e: any) {
      showToast(`Catalog refresh failed: ${e?.message}`);
    } finally {
      setIsRefreshingCatalog(false);
    }
  };

  // Diagnostics State
  const [diagnosticProvider, setDiagnosticProvider] = useState<ProviderId>('gemini');
  const [diagnosticResult, setDiagnosticResult] = useState<ConnectionTestResult | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Save or Update Provider
  const handleUpdateProvider = (id: ProviderId, updates: Partial<ProviderConfig>) => {
    const updated = AIProviderService.updateProvider(id, updates);
    setProviders(prev => prev.map(p => (p.id === id ? updated : p)));
    showToast(`Updated ${updated.name} settings.`);
  };

  // 2. Test Connection
  const handleTestConnection = async (id: ProviderId, testType: 'auth' | 'generation' | 'streaming' | 'tools' = 'auth') => {
    setIsTestingConnection(true);
    const res = await AIProviderService.testConnection(id, testType);
    setIsTestingConnection(false);
    setProviders(AIProviderService.loadProviders());
    setDiagnosticResult(res);
    return res;
  };

  // 3. Wizard Complete
  const handleSaveWizardProvider = async () => {
    const updates: Partial<ProviderConfig> = {
      apiKey: apiKeyInput.trim() || undefined,
      baseUrl: baseUrlInput.trim() || undefined,
      enabled: true,
    };
    AIProviderService.updateProvider(selectedProviderToAdd, updates);
    setProviders(AIProviderService.loadProviders());
    showToast(`Successfully configured ${selectedProviderToAdd.toUpperCase()}.`);
    setWizardStep(1);
    setActiveTab('connected');
    setApiKeyInput('');
    setBaseUrlInput('');
  };

  // 4. Update Role Assignment
  const handleRoleModelChange = (roleKey: keyof RoleModelAssignments, providerId: ProviderId, modelId: string) => {
    const next = { ...roleAssignments, [roleKey]: { providerId, modelId } };
    setRoleAssignments(next);
    AIProviderService.saveRoleAssignments(next);
    showToast(`Updated default model for ${String(roleKey)}.`);
  };

  // 5. Update Agent Override
  const handleAgentOverrideChange = (agentRole: string, providerId: ProviderId, modelId: string) => {
    const next = {
      ...agentOverrides,
      [agentRole]: {
        agentRole,
        providerId,
        modelId,
        inheritParent: false,
      },
    };
    setAgentOverrides(next);
    AIProviderService.saveAgentOverrides(next);
    showToast(`Updated ${agentRole} agent to ${modelId}.`);
  };

  // 6. Update Privacy Setting
  const handlePrivacyChange = (updates: Partial<PrivacySettings>) => {
    const next = { ...privacySettings, ...updates };
    setPrivacySettings(next);
    AIProviderService.savePrivacySettings(next);
    showToast('Privacy & security preferences updated.');
  };

  // Filtered Catalog
  const filteredModels = AIProviderService.filterModels({
    providerId: catalogProviderFilter === 'all' ? undefined : catalogProviderFilter,
    capability: catalogCapabilityFilter === 'all' ? undefined : catalogCapabilityFilter,
    query: catalogQuery,
  });

  // Calculate total costs and tokens
  const totalTokensUsed = usageHistory.reduce((acc, r) => acc + r.inputTokens + r.outputTokens, 0);
  const totalCostUsd = usageHistory.reduce((acc, r) => acc + r.estimatedCostUsd, 0);

  return (
    <div className="flex-1 bg-slate-950 flex flex-col text-slate-100 select-none overflow-hidden h-full">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">AI Provider Hub</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                BYOK Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bring your own API keys for Anthropic Claude, OpenAI, Gemini, local models & custom endpoints.
            </p>
          </div>
        </div>

        {/* Global Stats & Close button */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-4 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400">Tokens:</span>
              <span className="font-bold text-indigo-300">{totalTokensUsed.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400">Est. Cost:</span>
              <span className="font-bold text-emerald-400">${totalCostUsd.toFixed(4)}</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-indigo-600 text-white text-xs px-4 py-2 flex items-center justify-between font-medium shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Workspace with Tabs */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-56 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-2 md:p-3 flex md:flex-col flex-row overflow-x-auto md:overflow-y-auto gap-1 shrink-0 scrollbar-none">
          <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
            Provider Management
          </div>

          {[
            { id: 'connected', label: 'Connected Providers', icon: Cpu },
            { id: 'add', label: 'Add Provider (BYOK)', icon: Plus },
            { id: 'catalog', label: 'Model Catalog', icon: Sparkles },
            { id: 'defaults', label: 'Default Model Config', icon: Sliders },
            { id: 'agents', label: 'Agent Assignments', icon: Bot },
            { id: 'usage', label: 'Usage & Cost Tracking', icon: DollarSign },
            { id: 'privacy', label: 'Privacy & Data Policy', icon: Lock },
            { id: 'diagnostics', label: 'Connection Testing', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer shrink-0 whitespace-nowrap md:w-full ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden md:flex mt-auto p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex-col gap-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero Leakage</span>
            </div>
            <p className="leading-snug">
              API keys are masked and securely guarded. Environment secrets (.env) are excluded from context.
            </p>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-6">
          {/* TAB 1: CONNECTED PROVIDERS */}
          {activeTab === 'connected' && (
            <div className="max-w-4xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Configured AI Providers</h2>
                  <p className="text-xs text-slate-400">
                    Connect and toggle providers. The active orchestrator and specialist agents will use these credentials.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect New Provider</span>
                </button>
              </div>

              {/* Local AI Zero-Config Auto-Discovery Banner */}
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
                  type="button"
                  onClick={handleAutoDetectLocal}
                  disabled={isAutoDetecting}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isAutoDetecting ? 'animate-spin' : ''}`} />
                  <span>{isAutoDetecting ? 'Scanning Local Ports...' : 'Auto-Detect Local LLMs'}</span>
                </button>
              </div>

              {autoDetectResult && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  autoDetectResult.onlineCount > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {autoDetectResult.onlineCount > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>{autoDetectResult.message}</span>
                  </div>
                  <button onClick={() => setAutoDetectResult(null)} className="text-slate-400 hover:text-white px-1">
                    &times;
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {providers.map(p => {
                  const isConnected = p.status === 'connected';
                  return (
                    <div
                      key={p.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isConnected
                          ? 'bg-slate-900 border-slate-750 shadow-md'
                          : 'bg-slate-900/50 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                              p.id === 'gemini'
                                ? 'bg-indigo-600 text-white'
                                : p.id === 'openai'
                                ? 'bg-emerald-600 text-white'
                                : p.id === 'anthropic'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-800 text-cyan-400'
                            }`}
                          >
                            {p.id === 'gemini' ? '✦' : p.id === 'openai' ? '◎' : p.id === 'anthropic' ? '✽' : '⚡'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white">{p.name}</h3>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  isConnected
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {p.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                          </div>
                        </div>

                        {/* Enable toggle & quick test */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestConnection(p.id)}
                            disabled={isTestingConnection}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                            title="Verify real API credentials and endpoint reachability"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 text-indigo-400 ${
                                isTestingConnection ? 'animate-spin' : ''
                              }`}
                            />
                            <span>Test</span>
                          </button>

                          <button
                            onClick={() => handleUpdateProvider(p.id, { enabled: !p.enabled })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              p.enabled
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {p.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* Credentials Display & Mask */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium text-[11px]">Credential:</span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              {p.id === 'gemini' ? 'AI Studio Managed Key' : AIProviderService.maskApiKey(p.apiKey)}
                            </span>
                          </div>

                          {p.baseUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-medium text-[11px]">Endpoint:</span>
                              <span className="font-mono text-[11px] text-cyan-300 truncate max-w-xs">
                                {p.baseUrl}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Models Available:</span>
                          <span className="font-mono text-[11px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                            {p.models?.length || 0}
                          </span>
                        </div>
                      </div>

                      {p.error && (
                        <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{p.error}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ADD PROVIDER WIZARD */}
          {activeTab === 'add' && (
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
                  { num: 1, label: 'Select Provider' },
                  { num: 2, label: 'Credentials & URL' },
                  { num: 3, label: 'Test Connection' },
                  { num: 4, label: 'Confirm & Activate' },
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
                        id: 'anthropic',
                        name: 'Anthropic Claude',
                        desc: 'Claude 3.7 Sonnet, 3.5 Sonnet & Haiku with tool calling',
                      },
                      { id: 'openai', name: 'OpenAI', desc: 'GPT-4o, GPT-4o Mini, and o3-mini reasoning' },
                      {
                        id: 'custom',
                        name: 'OpenAI-Compatible Endpoint',
                        desc: 'Groq, Together AI, DeepSeek, or OpenRouter',
                      },
                      {
                        id: 'local',
                        name: 'Local Model Server',
                        desc: 'Ollama or LM Studio running on localhost',
                      },
                    ].map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedProviderToAdd(opt.id as ProviderId)}
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
                        // trigger automated verification
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
                      onClick={handleSaveWizardProvider}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                    >
                      Activate Provider in Studio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MODEL CATALOG */}
          {activeTab === 'catalog' && (
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
                    onChange={e => setCatalogProviderFilter(e.target.value as any)}
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
                    onChange={e => setCatalogCapabilityFilter(e.target.value as any)}
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
          )}

          {/* TAB 4: DEFAULT MODEL CONFIG */}
          {activeTab === 'defaults' && (
            <div className="max-w-4xl flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">Default Model Assignments</h2>
                <p className="text-xs text-slate-400">
                  Select which model handles each software engineering role across the IDE.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'defaultChat', label: 'Default Chat Assistant', desc: 'Used for general Q&A and prompt answers' },
                  { key: 'orchestrator', label: 'Main Orchestrator', desc: 'Plans autonomous task roadmaps and delegates' },
                  { key: 'coding', label: 'Coding Model', desc: 'Code generation, refactoring, and file modifications' },
                  { key: 'architecture', label: 'Architecture Model', desc: 'High-level system design and project planning' },
                  { key: 'frontend', label: 'Frontend Engineering', desc: 'UI components, Tailwind CSS styling, React hooks' },
                  { key: 'backend', label: 'Backend Engineering', desc: 'API endpoints, database queries, and server routes' },
                  { key: 'codeReview', label: 'Code Review & Audit', desc: 'Evaluates diffs and reports code quality scores' },
                  { key: 'testing', label: 'Testing & QA', desc: 'Generates unit tests, mocks, and regression suites' },
                  { key: 'debugging', label: 'Debugging & Self-Heal', desc: 'Parses error stack traces and crafts code patches' },
                  { key: 'fastLowCost', label: 'Fast / Low-Cost Model', desc: 'Quick checks, lint verification, and diagnostics' },
                ].map(r => {
                  const current = (roleAssignments as any)[r.key] || { providerId: 'gemini', modelId: 'gemini-3.8-flash' };
                  return (
                    <div key={r.key} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{r.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {current.providerId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{r.desc}</p>

                      <select
                        value={`${current.providerId}:${current.modelId}`}
                        onChange={e => {
                          const [pId, mId] = e.target.value.split(':');
                          handleRoleModelChange(r.key as any, pId as ProviderId, mId);
                        }}
                        className="mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        {providers
                          .flatMap(p => p.models.map(m => ({ providerId: p.id, modelId: m.id, name: `${p.name}: ${m.name}` })))
                          .map(opt => (
                            <option key={`${opt.providerId}:${opt.modelId}`} value={`${opt.providerId}:${opt.modelId}`}>
                              {opt.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: HIERARCHICAL AGENT MODEL ASSIGNMENTS */}
          {activeTab === 'agents' && (
            <div className="max-w-4xl flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">Hierarchical Agent Model Matrix</h2>
                <p className="text-xs text-slate-400">
                  Inspect and override which model is used by the Main Orchestrator, Specialist Leads, and Sub-Agents.
                </p>
              </div>

              {/* Hierarchy Tree */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
                {/* Orchestrator */}
                <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">MAIN ORCHESTRATOR</h4>
                      <p className="text-[10px] text-slate-400">Root coordinator across specialist leads</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {roleAssignments.orchestrator.modelId} ({roleAssignments.orchestrator.providerId})
                  </span>
                </div>

                {/* Specialist Leads */}
                <div className="pl-6 border-l-2 border-indigo-500/30 flex flex-col gap-3">
                  {[
                    { role: 'Architect', desc: 'System design, templates, directory hierarchies' },
                    { role: 'Frontend', desc: 'React components, UI styling, user experiences' },
                    { role: 'Backend', desc: 'REST/GraphQL endpoints, database schemas, API mocks' },
                    { role: 'Product Designer', desc: 'Design system tokens, color palettes, responsive layouts' },
                    { role: 'QA Lead', desc: 'Acceptance testing, unit assertions, coverage analysis' },
                    { role: 'Security Lead', desc: 'Dependency auditing, secret leakage checks, RBAC' },
                  ].map(agent => {
                    const current = agentOverrides[agent.role] || {
                      providerId: 'gemini',
                      modelId: 'gemini-3.8-flash',
                    };
                    return (
                      <div
                        key={agent.role}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bot className="w-4 h-4 text-indigo-400" />
                          <div>
                            <h5 className="text-xs font-bold text-white">{agent.role} Lead</h5>
                            <p className="text-[10px] text-slate-400">{agent.desc}</p>
                          </div>
                        </div>

                        <select
                          value={`${current.providerId}:${current.modelId}`}
                          onChange={e => {
                            const [pId, mId] = e.target.value.split(':');
                            handleAgentOverrideChange(agent.role, pId as ProviderId, mId);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-mono"
                        >
                          {providers
                            .flatMap(p => p.models.map(m => ({ providerId: p.id, modelId: m.id, name: `${p.name}: ${m.id}` })))
                            .map(opt => (
                              <option key={`${opt.providerId}:${opt.modelId}`} value={`${opt.providerId}:${opt.modelId}`}>
                                {opt.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USAGE & COST TRACKING */}
          {activeTab === 'usage' && (
            <div className="max-w-4xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Usage & Cost Tracking</h2>
                  <p className="text-xs text-slate-400">
                    Live telemetry on input/output tokens, estimated cost, and agent invocation history.
                  </p>
                </div>
                <button
                  onClick={() => {
                    AIProviderService.saveUsageHistory([]);
                    setUsageHistory([]);
                    showToast('Cleared usage history.');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Clear History
                </button>
              </div>

              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Total Tokens</span>
                  <span className="text-xl font-mono font-bold text-white mt-2">
                    {totalTokensUsed.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Prompt & Completion</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Estimated Cost</span>
                  <span className="text-xl font-mono font-bold text-emerald-400 mt-2">
                    ${totalCostUsd.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Based on active provider pricing</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Invocations</span>
                  <span className="text-xl font-mono font-bold text-indigo-300 mt-2">
                    {usageHistory.length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Autonomous agent requests</span>
                </div>
              </div>

              {/* Invocations Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 font-bold text-xs text-white">
                  Recent Request Log
                </div>
                <div className="divide-y divide-slate-800 text-xs">
                  {usageHistory.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">No requests recorded yet.</div>
                  ) : (
                    usageHistory.map(r => (
                      <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-850/50">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-500">{r.timestamp}</span>
                          <div>
                            <span className="font-semibold text-white">{r.agentRole} Agent</span>
                            <span className="text-[11px] text-slate-400 ml-2">({r.modelId})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-[11px]">
                          <span className="text-slate-300">{r.inputTokens + r.outputTokens} tok</span>
                          <span className="text-emerald-400">${r.estimatedCostUsd.toFixed(5)}</span>
                          <span className="text-slate-500">{r.durationMs}ms</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRIVACY & DATA POLICY */}
          {activeTab === 'privacy' && (
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
                    onChange={e => handlePrivacyChange({ excludeEnvSecrets: e.target.checked })}
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
                    onChange={e => handlePrivacyChange({ allowSendSourceCode: e.target.checked })}
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
                    onChange={e => handlePrivacyChange({ allowShareTerminalOutput: e.target.checked })}
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
                    onChange={e => handlePrivacyChange({ maxCostPerSessionUsd: Number(e.target.value) })}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DIAGNOSTICS & TEST CENTER */}
          {activeTab === 'diagnostics' && (
            <div className="max-w-3xl flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-white">Connection Diagnostics & Test Center</h2>
                <p className="text-xs text-slate-400">
                  Execute controlled live probe requests to verify authentication, latency, and streaming support.
                </p>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-200">Select Provider to Probe:</span>
                  <select
                    value={diagnosticProvider}
                    onChange={e => setDiagnosticProvider(e.target.value as ProviderId)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={async () => {
                      setIsDiagnosticRunning(true);
                      const res = await AIProviderService.testConnection(diagnosticProvider, 'generation');
                      setIsDiagnosticRunning(false);
                      setDiagnosticResult(res);
                    }}
                    disabled={isDiagnosticRunning}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Live Diagnostic Probe</span>
                  </button>
                </div>

                {diagnosticResult && (
                  <div className="mt-2 p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`font-bold ${
                          diagnosticResult.success ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diagnosticResult.success ? 'SUCCESS (200 OK)' : 'FAILED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latency:</span>
                      <span className="text-indigo-300">{diagnosticResult.latencyMs}ms</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Message:</span>
                      <span className="text-slate-200">{diagnosticResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
