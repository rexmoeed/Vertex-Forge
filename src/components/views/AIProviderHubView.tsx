import { AgentOverridesTab } from './providers/AgentOverridesTab';
import { PrivacyTab } from './providers/PrivacyTab';
import { ConnectedTab } from './providers/ConnectedTab';
import { DefaultsTab } from './providers/DefaultsTab';
import { UsageTab } from './providers/UsageTab';
import { AddProviderWizardTab } from './providers/AddProviderWizardTab';
import { ModelCatalogTab } from './providers/ModelCatalogTab';
import React, { useState, useMemo } from 'react';
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
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
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
  // ⚡ Bolt Performance: Memoize provider model filtering to avoid heavy re-computations and prevent lag during state updates
  const filteredModels = useMemo(() => {
    return AIProviderService.filterModels({
      providerId: catalogProviderFilter === 'all' ? undefined : catalogProviderFilter,
      capability: catalogCapabilityFilter === 'all' ? undefined : catalogCapabilityFilter,
      query: catalogQuery,
    });
  }, [catalogProviderFilter, catalogCapabilityFilter, catalogQuery]);

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
            <ConnectedTab
              providers={providers}
              onGoToAddTab={() => setActiveTab('add')}
              isAutoDetecting={isAutoDetecting}
              onAutoDetectLocalLLMs={handleAutoDetectLocal}
              autoDetectResult={autoDetectResult}
              onUpdateProvider={handleUpdateProvider}
              onTestConnection={handleTestConnection}
              isTestingConnection={isTestingConnection}
              diagnosticResult={diagnosticResult}
              diagnosticProvider={diagnosticProvider}
              onDeleteProvider={id => {
                const filtered = providers.filter(p => p.id !== id);
                AIProviderService.saveProviders(filtered);
                setProviders(filtered);
              }}
              showKeys={showKeys}
              onToggleShowKey={id => setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))}
            />
          )}

          {activeTab === 'add' && (
            <AddProviderWizardTab
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              selectedProviderToAdd={selectedProviderToAdd}
              setSelectedProviderToAdd={setSelectedProviderToAdd}
              apiKeyInput={apiKeyInput}
              setApiKeyInput={setApiKeyInput}
              baseUrlInput={baseUrlInput}
              setBaseUrlInput={setBaseUrlInput}
              showKeyPlaintext={showKeyPlaintext}
              setShowKeyPlaintext={setShowKeyPlaintext}
              isTestingConnection={isTestingConnection}
              setIsTestingConnection={setIsTestingConnection}
              wizardTestResult={wizardTestResult}
              setWizardTestResult={setWizardTestResult}
              onSave={handleSaveWizardProvider}
            />
          )}

          {/* TAB 3: MODEL CATALOG */}
          {activeTab === 'catalog' && (
            <ModelCatalogTab
              catalogQuery={catalogQuery}
              setCatalogQuery={setCatalogQuery}
              catalogProviderFilter={catalogProviderFilter}
              setCatalogProviderFilter={setCatalogProviderFilter}
              catalogCapabilityFilter={catalogCapabilityFilter}
              setCatalogCapabilityFilter={setCatalogCapabilityFilter}
              filteredModels={filteredModels}
              handleRefreshCatalog={handleRefreshCatalog}
              isRefreshingCatalog={isRefreshingCatalog}
            />
          )}

          {/* TAB 4: DEFAULT MODEL CONFIG */}
          {activeTab === 'defaults' && (
            <DefaultsTab
              roleAssignments={roleAssignments}
              providers={providers}
              onRoleModelChange={handleRoleModelChange}
            />
          )}

          {activeTab === 'agents' && (
            <AgentOverridesTab
              roleAssignments={roleAssignments}
              agentOverrides={agentOverrides}
              providers={providers}
              onAgentOverrideChange={handleAgentOverrideChange}
            />
          )}

          {activeTab === 'usage' && (
            <UsageTab
              usageHistory={usageHistory}
              totalTokensUsed={totalTokensUsed}
              totalCostUsd={totalCostUsd}
              onClearHistory={() => {
                AIProviderService.saveUsageHistory([]);
                setUsageHistory([]);
                showToast('Cleared usage history.');
              }}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyTab
              privacySettings={privacySettings}
              onPrivacyChange={handlePrivacyChange}
            />
          )}

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
