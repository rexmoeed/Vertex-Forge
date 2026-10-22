import React from 'react';
import { Save, Check, Clock, FileCode, Zap, CheckCircle2 } from 'lucide-react';

export interface EditorSettingsSectionProps {
  autoSave: boolean;
  setAutoSave: (val: boolean) => void;
  autoSaveDelay: number;
  setAutoSaveDelay: (val: number) => void;
  saveAllFiles: () => void;
  saveCurrentFile?: () => void;
  fontSize?: number;
  setFontSize?: (val: number) => void;
}

export const EditorSettingsSection: React.FC<EditorSettingsSectionProps> = ({
  autoSave,
  setAutoSave,
  autoSaveDelay,
  setAutoSaveDelay,
  saveAllFiles,
  saveCurrentFile,
  fontSize: propFontSize,
  setFontSize: propSetFontSize,
}) => {
  const [internalFontSize, setInternalFontSize] = React.useState<number>(13);
  const fontSize = propFontSize ?? internalFontSize;
  const setFontSize = propSetFontSize ?? setInternalFontSize;
  return (
            <div className="flex flex-col gap-6 text-xs">
              <div
                style={{ borderColor: 'var(--ide-border)' }}
                className="border-b pb-3 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">Editor & Auto-Save Configuration</h3>
                  <p className="text-[11px] text-slate-400">
                    Control automatic file saving triggers, debounce thresholds, focus-loss persistence, and editor behavior.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveAllFiles()}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Save All Files</span>
                  </button>
                </div>
              </div>

              {/* 1. HERO GLOBAL AUTO-SAVE TOGGLE CARD */}
              <div
                style={{
                  backgroundColor: 'var(--ide-surface-elevated)',
                  borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'var(--ide-border)',
                }}
                className="p-5 rounded-2xl border flex flex-col gap-4 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        borderColor: autoSave ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.3)',
                      }}
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                    >
                      <Zap className={`w-5 h-5 ${autoSave ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-white">Global Auto-Save</h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            autoSave
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {autoSave ? 'ACTIVE • ON FILE CHANGE & FOCUS LOSS' : 'DISABLED • MANUAL SAVE (Cmd+S)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        When enabled, modified files are automatically saved to disk when file content changes or immediately when the editor loses focus (switching panels, tabs, or external applications).
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={e => setAutoSave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                  </label>
                </div>

                {/* Two Triggers Detail Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Trigger 1: File Change */}
                  <div
                    style={{
                      backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                      borderColor: autoSave ? 'rgba(16, 185, 129, 0.25)' : 'var(--ide-border)',
                    }}
                    className="p-3.5 rounded-xl border flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className={`w-4 h-4 ${autoSave ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="font-bold text-white text-xs">Trigger 1: On File Change</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        autoSave ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Debounced ({autoSaveDelay}ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      As you type, changes are staged in the virtual workspace and committed to disk automatically {autoSaveDelay}ms after typing pauses, avoiding excessive I/O while guaranteeing safety.
                    </p>
                  </div>

                  {/* Trigger 2: Focus Loss */}
                  <div
                    style={{
                      backgroundColor: autoSave ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                      borderColor: autoSave ? 'rgba(16, 185, 129, 0.25)' : 'var(--ide-border)',
                    }}
                    className="p-3.5 rounded-xl border flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${autoSave ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="font-bold text-white text-xs">Trigger 2: On Focus Loss</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        autoSave ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Instant Flush (0ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Immediately commits unsaved edits the instant you click away from the code editor (e.g., clicking the terminal, explorer, AI assistant, changing tabs, or blurring the browser window).
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. AUTO-SAVE DEBOUNCE DELAY SETTINGS */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200">Auto-Save Delay (File Change Debounce)</h4>
                    <p className="text-[10px] text-slate-400">
                      Duration in milliseconds to wait after your last keystroke before saving file to disk.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                    {autoSaveDelay} ms
                  </span>
                </div>

                {/* Preset Delay Buttons */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { ms: 500, label: '500ms', desc: 'Fast' },
                    { ms: 1000, label: '1000ms', desc: 'Recommended' },
                    { ms: 2000, label: '2000ms', desc: 'Relaxed' },
                    { ms: 3000, label: '3000ms', desc: 'Deferred' },
                  ].map(opt => {
                    const isSelected = autoSaveDelay === opt.ms;
                    return (
                      <button
                        key={opt.ms}
                        onClick={() => setAutoSaveDelay(opt.ms)}
                        style={{
                          borderColor: isSelected ? 'var(--ide-accent)' : 'var(--ide-border)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                        }}
                        className="p-2.5 rounded-lg border text-left flex flex-col gap-0.5 cursor-pointer transition-colors hover:border-slate-500"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={autoSaveDelay}
                  onChange={e => setAutoSaveDelay(Number(e.target.value))}
                  className="accent-indigo-500 mt-1"
                />
              </div>

              {/* 3. WORKSPACE PERSISTENCE VERIFICATION & ACTIONS */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <h4 className="font-bold text-slate-200">Manual Save & Workspace Persistence</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => saveCurrentFile?.()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Active File</span>
                  </button>
                  <button
                    onClick={() => saveAllFiles()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save All Workspace Files</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-[11px] flex items-center justify-between">
                  <span>Auto-Save state is remembered across reloads via browser local storage.</span>
                  <span className="text-emerald-400 font-mono text-[10px]">vertexforge_autosave: {String(autoSave)}</span>
                </div>
              </div>

              {/* 4. EDITOR TYPOGRAPHY & BEHAVIOR */}
              <div
                style={{ backgroundColor: 'var(--ide-surface-elevated)', borderColor: 'var(--ide-border)' }}
                className="p-4 rounded-xl border flex flex-col gap-3"
              >
                <h4 className="font-bold text-slate-200">Editor Typography & Gutter</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold">Editor Font Size: {fontSize}px</label>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500">Default: 13px monospaced font</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-semibold">Tab Spacing</label>
                    <div className="flex gap-2">
                      {[2, 4].map(spaces => (
                        <button
                          key={spaces}
                          style={{
                            backgroundColor: spaces === 2 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                            borderColor: spaces === 2 ? 'var(--ide-accent)' : 'var(--ide-border)',
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-mono text-slate-200 cursor-pointer"
                        >
                          {spaces} Spaces
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
};
