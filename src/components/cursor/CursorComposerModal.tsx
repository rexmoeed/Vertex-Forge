import { logger } from '../../services/logger';
import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  Sparkles,
  X,
  Check,
  SplitSquareVertical,
  Layers,
  ChevronDown,
  Cpu,
  FileCode,
  FilePlus,
  GitBranch,
  Terminal,
  BookOpen,
  BrainCircuit,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Columns,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ProposedFileChange } from '../../types/desktop';
import { CursorService, CursorContextItem, CursorGenerationResult } from '../../services/cursorService';

interface CursorComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CursorComposerModal: React.FC<CursorComposerModalProps> = ({ isOpen, onClose }) => {
  const { vfs, activeFile, openFile, applySelectedChanges } = useIDE() as any;

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState(false);
  const [activeContexts, setActiveContexts] = useState<CursorContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generationResult, setGenerationResult] = useState<CursorGenerationResult | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'unified'>('split');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available @ Context options
  const availableContexts = CursorService.getAvailableContextOptions(vfs, activeFile);

  // Initialize with codebase and active file context
  useEffect(() => {
    if (isOpen) {
      const defaultCtx: CursorContextItem[] = [
        availableContexts.find(c => c.type === 'codebase') || {
          id: 'ctx-codebase',
          type: 'codebase',
          label: '@Codebase',
          detail: 'Full project symbols',
        },
      ];
      if (activeFile) {
        defaultCtx.push({
          id: `file-${activeFile}`,
          type: 'file',
          label: `@${activeFile.split('/').pop() || activeFile}`,
          detail: activeFile,
        });
      }
      setActiveContexts(defaultCtx);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setGenerationResult(null);
    }
  }, [isOpen, activeFile]);

  // Keyboard shortcut Cmd/Ctrl + Enter to generate or accept
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (generationResult && generationResult.changes.length > 0) {
          handleAcceptAll();
        } else if (prompt.trim() && !isLoading) {
          handleGenerate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, prompt, isLoading, generationResult]);

  if (!isOpen) return null;

  const handleAddContext = (ctx: CursorContextItem) => {
    if (!activeContexts.some(c => c.id === ctx.id)) {
      setActiveContexts(prev => [...prev, ctx]);
    }
    setIsContextDropdownOpen(false);
  };

  const handleRemoveContext = (id: string) => {
    setActiveContexts(prev => prev.filter(c => c.id !== id));
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    if (val.endsWith('@')) {
      setIsContextDropdownOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await CursorService.composeMultiFileChanges(
        prompt.trim(),
        vfs,
        activeContexts,
        selectedModel
      );
      setGenerationResult(result);
      setSelectedFileIndex(0);
    } catch (err) {
      logger.error('Composer generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAcceptFile = (idx: number) => {
    if (!generationResult) return;
    setGenerationResult(prev => {
      if (!prev) return null;
      const updated = [...prev.changes];
      updated[idx] = { ...updated[idx], accepted: !updated[idx].accepted };
      return { ...prev, changes: updated };
    });
  };

  const handleAcceptAll = () => {
    if (!generationResult || generationResult.changes.length === 0) return;
    applySelectedChanges(generationResult.changes);
    onClose();
  };

  const currentChange: ProposedFileChange | undefined = generationResult?.changes[selectedFileIndex];

  const models = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High)' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Thinking)' },
    { id: 'gpt-4o', name: 'GPT-4o (Omni Reasoning)' },
    { id: 'deepseek-r1', name: 'DeepSeek R1 (Deep Think)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-5xl h-[86vh] shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col text-slate-100 font-sans">
        {/* 1. COMPOSER HEADER */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Cursor Composer
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-bold">
                    ⌘I
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-file intelligent code generation, cross-component refactoring, and granular diff review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Chip */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-xs font-mono text-indigo-300 transition-colors"
                title="Select Reasoning Model"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[150px]">
                  {models.find(m => m.id === selectedModel)?.name.split(' ')[0] || selectedModel}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Composer Models
                  </div>
                  {models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        selectedModel === m.id ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-semibold">{m.name}</span>
                      {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Composer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. PROMPT & CONTEXT SECTION */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-2.5 shrink-0">
          {/* Active @ Context Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">
              Context:
            </span>
            {activeContexts.map(ctx => (
              <span
                key={ctx.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 shadow-xs"
              >
                {ctx.type === 'codebase' && <Layers className="w-3 h-3 text-cyan-400" />}
                {ctx.type === 'git' && <GitBranch className="w-3 h-3 text-emerald-400" />}
                {ctx.type === 'terminal' && <Terminal className="w-3 h-3 text-amber-400" />}
                {ctx.type === 'file' && <FileCode className="w-3 h-3 text-indigo-400" />}
                {ctx.type === 'rules' && <BrainCircuit className="w-3 h-3 text-purple-400" />}
                <span>{ctx.label}</span>
                <button
                  onClick={() => handleRemoveContext(ctx.id)}
                  className="hover:text-rose-400 transition-colors ml-0.5"
                  title="Remove context"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}

            {/* Add Context @ Button */}
            <div className="relative">
              <button
                onClick={() => setIsContextDropdownOpen(!isContextDropdownOpen)}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer flex items-center gap-1"
                title="Attach Files, Codebase, Git, or Terminal (@)"
              >
                <span>+ @ Mention</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              {isContextDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-56 overflow-y-auto bg-slate-900 border border-slate-750 rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Contexts
                  </div>
                  {availableContexts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleAddContext(c)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-200 transition-colors flex flex-col"
                    >
                      <span className="font-semibold">{c.label}</span>
                      {c.detail && <span className="text-[10px] text-slate-400 truncate">{c.detail}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="flex flex-col bg-slate-900 border border-slate-750 focus-within:border-indigo-500 rounded-xl p-2.5 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              rows={3}
              placeholder="Describe feature or multi-file changes (e.g. 'Build an authentication provider with user session, login modal, and route guard'). Type @ to mention files..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none resize-none font-mono leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-1">
              {/* Quick Prompt Chips */}
              <div className="hidden sm:flex items-center gap-1 text-[10px]">
                {[
                  'Refactor across files',
                  'Add unit tests',
                  'Strict TypeScript types',
                  'Fix runtime errors',
                ].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setPrompt(chip)}
                    className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-indigo-900/40 text-slate-400 hover:text-indigo-200 border border-slate-750 transition-colors cursor-pointer"
                  >
                    ✦ {chip}
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <button
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                {isLoading ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                    <span>Planning Changes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate (⌘Enter)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. GENERATION RESULTS & DIFF PREVIEW */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-950">
          {!generationResult ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-3">
                <Layers className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Cursor Composer Ready</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Type instructions above and press <kbd className="font-mono text-indigo-300">⌘Enter</kbd>. Composer will inspect your workspace, plan file changes, and show unified diff previews.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Affected Files List */}
              <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Changed Files ({generationResult.changes.length})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {generationResult.changes.filter(c => c.accepted).length} accepted
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {generationResult.changes.map((chg, idx) => {
                    const isSelected = idx === selectedFileIndex;
                    return (
                      <div
                        key={chg.id}
                        onClick={() => setSelectedFileIndex(idx)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500/70 text-white shadow-sm'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <input
                              type="checkbox"
                              checked={chg.accepted}
                              onChange={e => {
                                e.stopPropagation();
                                handleToggleAcceptFile(idx);
                              }}
                              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] truncate font-medium">
                              {chg.filePath}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              chg.action === 'create'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {chg.action}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pl-5 text-slate-400 font-mono">
                          <span className="text-emerald-400">+{chg.additions} -{chg.deletions}</span>
                          <span className={chg.accepted ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                            {chg.accepted ? 'Accepted' : 'Skipped'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Visual Diff Preview */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                {currentChange ? (
                  <>
                    <div className="h-9 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/60 text-xs shrink-0">
                      <div className="flex items-center gap-2 truncate font-mono text-[11px] text-slate-200">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-semibold truncate">{currentChange.filePath}</span>
                        <span className="text-slate-500">—</span>
                        <span className="text-slate-400 text-[10px] font-sans truncate">
                          {currentChange.explanation}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleAcceptFile(selectedFileIndex)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            currentChange.accepted
                              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {currentChange.accepted ? '✓ Included' : 'Excluded'}
                        </button>
                      </div>
                    </div>

                    {/* Diff Code Area */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-5 select-text">
                      <div className="space-y-0.5">
                        {currentChange.newContent.split('\n').map((line, i) => {
                          const isAdded = !currentChange.originalContent || !currentChange.originalContent.includes(line);
                          return (
                            <div
                              key={i}
                              className={`flex items-start px-2 py-0.2 rounded-xs ${
                                isAdded ? 'bg-emerald-950/40 text-emerald-200 font-medium' : 'text-slate-300'
                              }`}
                            >
                              <span className="w-8 text-right text-slate-600 select-none pr-3 text-[10px]">
                                {i + 1}
                              </span>
                              <span className="w-4 select-none text-[11px]">
                                {isAdded ? '+' : ' '}
                              </span>
                              <span className="flex-1 whitespace-pre">{line || ' '}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Select a file to inspect diff
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. COMPOSER FOOTER ACTIONS */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">⌘I</kbd>
            <span>to toggle Composer</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!generationResult || generationResult.changes.length === 0}
              onClick={handleAcceptAll}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All ({generationResult?.changes.filter(c => c.accepted).length || 0} files)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
