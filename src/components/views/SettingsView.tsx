import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings,
  Palette,
  Bot,
  Shield,
  Terminal,
  FileCode,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Layout,
  RefreshCw,
} from 'lucide-react';
import { EditorSettingsSection } from './settings/EditorSettingsSection';
import { AppearanceSettingsSection } from './settings/AppearanceSettingsSection';
import { LayoutSettingsSection } from './settings/LayoutSettingsSection';
import { ProvidersSettingsSection } from './settings/ProvidersSettingsSection';
import { AiEngineSettingsSection } from './settings/AiEngineSettingsSection';
import { AgentsSettingsSection } from './settings/AgentsSettingsSection';
import { SecuritySettingsSection } from './settings/SecuritySettingsSection';

export const SettingsView: React.FC = () => {
  const {
    autonomyMode,
    setAutonomyMode,
    setActiveView,
    autoSave,
    setAutoSave,
    autoSaveDelay,
    setAutoSaveDelay,
    saveCurrentFile,
    saveAllFiles,
  } = useIDE();
  const layout = useLayout();
  const themeEngine = useTheme();

  const [activeSection, setActiveSection] = useState<
    'appearance' | 'layout' | 'editor' | 'providers' | 'ai' | 'agents' | 'terminal' | 'security'
  >('appearance');

  // Local settings state
  const [fontSize, setFontSize] = useState<number>(13);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxConcurrentAgents, setMaxConcurrentAgents] = useState<number>(4);
  const [terminalTimeout, setTerminalTimeout] = useState<number>(30);
  const [protectEnvFiles, setProtectEnvFiles] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetAppearance = () => {
    themeEngine.setTheme('vertex-dark');
    themeEngine.setAccentColor('#6366f1');
    themeEngine.setThemeMode('dark');
    themeEngine.setDensity('comfortable');
    themeEngine.setReducedMotion(false);
    setResetNotice('Appearance reset to Vertex Forge Dark default.');
    setTimeout(() => setResetNotice(null), 3500);
  };

  const handleResetLayout = () => {
    layout.resetLayout();
    setResetNotice('Panels and splitters restored to balanced defaults.');
    setTimeout(() => setResetNotice(null), 3500);
  };

  const sections = [
    { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
    { id: 'layout', label: 'Layout & Panels', icon: Layout },
    { id: 'editor', label: 'Editor & Files', icon: FileCode },
    { id: 'providers', label: 'AI Provider Hub (BYOK)', icon: Sliders },
    { id: 'ai', label: 'AI Engine & Models', icon: Sparkles },
    { id: 'agents', label: 'Autonomous Agents', icon: Bot },
    { id: 'terminal', label: 'Terminal Execution', icon: Terminal },
    { id: 'security', label: 'Security & Isolation', icon: Shield },
  ];

  return (
    <div
      style={{ backgroundColor: 'var(--ide-bg)', color: 'var(--ide-text)' }}
      className="flex-1 w-full h-full min-h-0 overflow-y-auto p-6 flex flex-col gap-6 select-none"
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--ide-surface)',
          borderColor: 'var(--ide-border)',
        }}
        className="border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              backgroundColor: 'var(--ide-surface-elevated)',
              borderColor: 'var(--ide-border)',
              color: 'var(--ide-accent)',
            }}
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow shrink-0"
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Vertex Forge Studio Settings</h2>
            <p className="text-xs text-slate-400">
              Configure appearance, professional themes, panel layout stability, model parameters, and security rules.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {resetNotice && (
            <span className="text-xs text-emerald-400 font-medium px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 animate-fadeIn">
              {resetNotice}
            </span>
          )}

          {/* Global Auto-Save Header Toggle */}
          <button
            type="button"
            onClick={() => setAutoSave(!autoSave)}
            style={{
              backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.12)' : 'var(--ide-surface-elevated)',
              borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'var(--ide-border)',
            }}
            className="border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-all hover:border-slate-500"
            title="Toggle Global Auto-Save (triggers on file changes and focus loss)"
          >
            <div className={`w-2 h-2 rounded-full ${autoSave ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-200 font-semibold">Auto-Save:</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              autoSave ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {autoSave ? 'ENABLED' : 'DISABLED'}
            </span>
          </button>

          <button
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--ide-accent)',
              color: '#ffffff',
            }}
            className="px-4 py-2 hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved' : 'Save Preferences'}</span>
          </button>

          <button
            onClick={() => setActiveView('editor')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Return to Main Editor Workspace"
          >
            <span>←</span> Back to Editor
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Navigation Sidebar */}
        <div
          style={{
            backgroundColor: 'var(--ide-surface)',
            borderColor: 'var(--ide-border)',
          }}
          className="border rounded-xl p-2 flex flex-col gap-1 h-fit"
        >
          {sections.map(s => {
            const Icon = s.icon;
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id as any)}
                style={{
                  backgroundColor: isSelected ? 'var(--ide-accent)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--ide-text-muted)',
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer hover:text-white"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{s.label}</span>
              </button>
            );
          })}

          <div
            style={{ borderColor: 'var(--ide-border)' }}
            className="border-t my-2 pt-2 flex flex-col gap-1"
          >
            <button
              onClick={handleResetAppearance}
              className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 flex items-center gap-2 cursor-pointer"
              title="Reset theme and colors to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Appearance</span>
            </button>
            <button
              onClick={handleResetLayout}
              className="w-full text-left px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 flex items-center gap-2 cursor-pointer"
              title="Reset panels and splitters to default"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>

        {/* Setting Panels */}
        <div
          style={{
            backgroundColor: 'var(--ide-surface)',
            borderColor: 'var(--ide-border)',
          }}
          className="lg:col-span-3 border rounded-xl p-6 flex flex-col gap-6"
        >
          {activeSection === 'appearance' && (
            <AppearanceSettingsSection onResetAppearance={handleResetAppearance} />
          )}

          {activeSection === 'layout' && (
            <LayoutSettingsSection onResetLayout={handleResetLayout} />
          )}

          {activeSection === 'editor' && (
            <EditorSettingsSection
              autoSave={autoSave}
              setAutoSave={setAutoSave}
              autoSaveDelay={autoSaveDelay}
              setAutoSaveDelay={setAutoSaveDelay}
              saveAllFiles={saveAllFiles}
              saveCurrentFile={saveCurrentFile}
              fontSize={fontSize}
              setFontSize={setFontSize}
            />
          )}

          {activeSection === 'providers' && (
            <ProvidersSettingsSection onOpenProvidersHub={() => setActiveView('providers')} />
          )}

          {activeSection === 'ai' && (
            <AiEngineSettingsSection
              activeModel={activeModel}
              setActiveModel={setActiveModel}
              temperature={temperature}
              setTemperature={setTemperature}
            />
          )}

          {activeSection === 'agents' && (
            <AgentsSettingsSection
              autonomyMode={autonomyMode}
              setAutonomyMode={setAutonomyMode}
              maxConcurrentAgents={maxConcurrentAgents}
              setMaxConcurrentAgents={setMaxConcurrentAgents}
            />
          )}

          {activeSection === 'terminal' && (
            <SecuritySettingsSection
              protectEnvFiles={protectEnvFiles}
              setProtectEnvFiles={setProtectEnvFiles}
              terminalTimeout={terminalTimeout}
              setTerminalTimeout={setTerminalTimeout}
              isTerminalSection={true}
            />
          )}

          {activeSection === 'security' && (
            <SecuritySettingsSection
              protectEnvFiles={protectEnvFiles}
              setProtectEnvFiles={setProtectEnvFiles}
              terminalTimeout={terminalTimeout}
              setTerminalTimeout={setTerminalTimeout}
              isTerminalSection={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
