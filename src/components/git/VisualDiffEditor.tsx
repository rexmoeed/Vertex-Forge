import { logger } from '../../services/logger';
import React, { useState, useEffect } from 'react';
import {
  SplitSquareVertical,
  AlignJustify,
  Check,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RotateCcw,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
} from 'lucide-react';
import { GitFileDiff, GitDiffHunk, GitDiffLine } from '../../types/gitWorkflow';
import { GitWorkflowService } from '../../services/gitWorkflowService';
import { ConfirmDialogModal } from '../modals/ConfirmDialogModal';

interface VisualDiffEditorProps {
  filePath: string;
  staged?: boolean;
  onClose?: () => void;
  onStageToggle?: (staged: boolean) => void;
}

export const VisualDiffEditor: React.FC<VisualDiffEditorProps> = ({
  filePath,
  staged = false,
  onClose,
  onStageToggle,
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [diff, setDiff] = useState<GitFileDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHunkIndex, setActiveHunkIndex] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    loadDiff();
  }, [filePath, staged]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const result = await GitWorkflowService.getFileDiff(filePath, staged);
      setDiff(result);
      setActiveHunkIndex(0);
    } catch (e) {
      logger.error('Failed to load diff:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStageAction = async () => {
    if (staged) {
      await GitWorkflowService.unstage(filePath);
      onStageToggle?.(false);
    } else {
      await GitWorkflowService.stage(filePath);
      onStageToggle?.(true);
    }
    loadDiff();
  };

  const handleDiscardAction = () => {
    setIsDiscardConfirmOpen(true);
  };

  const handleConfirmDiscard = async () => {
    setIsDiscardConfirmOpen(false);
    await GitWorkflowService.discard(filePath);
    loadDiff();
    onClose?.();
  };

  const handleExplainWithAI = async () => {
    if (!diff?.rawDiff) return;
    setIsExplaining(true);
    try {
      const explanation = await GitWorkflowService.aiExplainDiff(diff.rawDiff);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation('Unable to generate AI explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleNextHunk = () => {
    if (!diff || diff.hunks.length === 0) return;
    setActiveHunkIndex(prev => (prev + 1) % diff.hunks.length);
  };

  const handlePrevHunk = () => {
    if (!diff || diff.hunks.length === 0) return;
    setActiveHunkIndex(prev => (prev - 1 + diff.hunks.length) % diff.hunks.length);
  };

  const handleCopyDiff = () => {
    if (diff?.rawDiff) {
      navigator.clipboard.writeText(diff.rawDiff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Computing Git diff...</span>
        </div>
      </div>
    );
  }

  const hunks = diff?.hunks || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden font-mono text-xs select-none">
      {/* 1. TOP DIFF TOOLBAR */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/80 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-bold text-slate-200 truncate">{filePath}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
              staged
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {staged ? 'Staged' : 'Working Tree'}
          </span>
          {diff && (
            <div className="text-[11px] font-mono flex items-center gap-2 shrink-0">
              <span className="text-emerald-400 font-bold">+{diff.additions}</span>
              <span className="text-rose-400 font-bold">-{diff.deletions}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Hunk Navigation */}
          {hunks.length > 0 && (
            <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-400">
              <span className="px-1 text-slate-300">
                Hunk {activeHunkIndex + 1} of {hunks.length}
              </span>
              <button
                onClick={handlePrevHunk}
                className="p-1 hover:text-white rounded hover:bg-slate-800"
                title="Previous change"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={handleNextHunk}
                className="p-1 hover:text-white rounded hover:bg-slate-800"
                title="Next change"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Side-by-Side vs Inline Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 text-[10px]">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                viewMode === 'side-by-side' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-side Diff View"
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                viewMode === 'inline' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Unified Inline Diff View"
            >
              <AlignJustify className="w-3 h-3" />
              <span>Inline</span>
            </button>
          </div>

          {/* AI Explain Button */}
          <button
            onClick={handleExplainWithAI}
            disabled={isExplaining}
            className="px-2 py-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow cursor-pointer"
            title="Explain changes with Gemini AI"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isExplaining ? 'Analyzing...' : 'AI Explain'}</span>
          </button>

          {/* Copy Raw Diff */}
          <button
            onClick={handleCopyDiff}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
            title="Copy Raw Diff"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Stage / Unstage Button */}
          <button
            onClick={handleStageAction}
            className={`px-2.5 py-1 rounded font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer ${
              staged
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {staged ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            <span>{staged ? 'Unstage' : 'Stage'}</span>
          </button>

          {/* Discard Button (if unstaged) */}
          {!staged && (
            <button
              onClick={handleDiscardAction}
              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
              title="Discard changes in working tree"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-1 cursor-pointer"
              title="Close Diff"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Explanation Drawer */}
      {aiExplanation && (
        <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 text-xs font-sans">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-200">AI Diff Explanation</p>
              <p className="text-slate-300 text-[11px] whitespace-pre-wrap mt-0.5 leading-relaxed">
                {aiExplanation}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiExplanation(null)}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. DIFF CONTENT VIEWPORT */}
      <div className="flex-1 overflow-auto p-2 font-mono text-[11px] leading-5">
        {hunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
            <span>No changes detected for this file.</span>
          </div>
        ) : viewMode === 'inline' ? (
          /* INLINE VIEW */
          <div className="space-y-4">
            {hunks.map((hunk, hIdx) => (
              <div
                key={hIdx}
                className={`border rounded-lg overflow-hidden ${
                  hIdx === activeHunkIndex ? 'border-indigo-500/60 ring-1 ring-indigo-500/40' : 'border-slate-800'
                }`}
              >
                {/* Hunk Header */}
                <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-indigo-300 font-bold text-[10px]">
                  {hunk.header}
                </div>

                <div className="divide-y divide-slate-900/40">
                  {hunk.lines.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className={`flex items-start ${
                        line.type === 'added'
                          ? 'bg-emerald-950/40 text-emerald-200'
                          : line.type === 'deleted'
                          ? 'bg-rose-950/40 text-rose-200'
                          : 'text-slate-400 hover:bg-slate-900/30'
                      }`}
                    >
                      {/* Old Line Number */}
                      <span className="w-10 text-right pr-2 text-slate-600 select-none border-r border-slate-800/80 shrink-0">
                        {line.oldLineNumber || ''}
                      </span>
                      {/* New Line Number */}
                      <span className="w-10 text-right pr-2 text-slate-600 select-none border-r border-slate-800/80 shrink-0">
                        {line.newLineNumber || ''}
                      </span>
                      {/* Sign indicator */}
                      <span className="w-5 text-center select-none font-bold shrink-0">
                        {line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' '}
                      </span>
                      {/* Code Content */}
                      <span className="whitespace-pre flex-1 pl-1 font-mono">{line.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* SIDE-BY-SIDE VIEW */
          <div className="space-y-4">
            {hunks.map((hunk, hIdx) => {
              // Pair deletions and additions for side-by-side display
              const oldLines: GitDiffLine[] = [];
              const newLines: GitDiffLine[] = [];

              hunk.lines.forEach(l => {
                if (l.type === 'deleted') {
                  oldLines.push(l);
                } else if (l.type === 'added') {
                  newLines.push(l);
                } else {
                  // context line in both
                  while (oldLines.length < newLines.length) {
                    oldLines.push({ type: 'context', content: '' });
                  }
                  while (newLines.length < oldLines.length) {
                    newLines.push({ type: 'context', content: '' });
                  }
                  oldLines.push(l);
                  newLines.push(l);
                }
              });

              while (oldLines.length < newLines.length) {
                oldLines.push({ type: 'context', content: '' });
              }
              while (newLines.length < oldLines.length) {
                newLines.push({ type: 'context', content: '' });
              }

              return (
                <div
                  key={hIdx}
                  className={`border rounded-lg overflow-hidden ${
                    hIdx === activeHunkIndex ? 'border-indigo-500/60 ring-1 ring-indigo-500/40' : 'border-slate-800'
                  }`}
                >
                  <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-indigo-300 font-bold text-[10px] flex items-center justify-between">
                    <span>{hunk.header}</span>
                    <span className="text-slate-500">Original vs Modified</span>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-slate-800">
                    {/* Left Column: Original */}
                    <div>
                      {oldLines.map((line, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start ${
                            line.type === 'deleted'
                              ? 'bg-rose-950/40 text-rose-200'
                              : 'text-slate-400'
                          }`}
                        >
                          <span className="w-10 text-right pr-2 text-slate-600 select-none border-r border-slate-800/80 shrink-0">
                            {line.oldLineNumber || ''}
                          </span>
                          <span className="w-4 text-center select-none font-bold text-rose-400 shrink-0">
                            {line.type === 'deleted' ? '-' : ' '}
                          </span>
                          <span className="whitespace-pre flex-1 pl-1 overflow-x-auto no-scrollbar font-mono">
                            {line.content}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Right Column: Modified */}
                    <div>
                      {newLines.map((line, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start ${
                            line.type === 'added'
                              ? 'bg-emerald-950/40 text-emerald-200'
                              : 'text-slate-400'
                          }`}
                        >
                          <span className="w-10 text-right pr-2 text-slate-600 select-none border-r border-slate-800/80 shrink-0">
                            {line.newLineNumber || ''}
                          </span>
                          <span className="w-4 text-center select-none font-bold text-emerald-400 shrink-0">
                            {line.type === 'added' ? '+' : ' '}
                          </span>
                          <span className="whitespace-pre flex-1 pl-1 overflow-x-auto no-scrollbar font-mono">
                            {line.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialogModal
        isOpen={isDiscardConfirmOpen}
        title="Discard Changes"
        message={`Are you sure you want to discard uncommitted changes in "${filePath}"? Any edits will be permanently lost.`}
        confirmText="Discard Changes"
        cancelText="Cancel"
        severity="danger"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />
    </div>
  );
};
