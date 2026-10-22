import { logger } from '../../services/logger';
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  X,
  FileCode,
  ArrowRight,
  GitMerge,
  SplitSquareVertical,
} from 'lucide-react';
import { GitConflictFile, GitConflictBlock } from '../../types/gitWorkflow';
import { GitWorkflowService } from '../../services/gitWorkflowService';

interface MergeConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export const MergeConflictModal: React.FC<MergeConflictModalProps> = ({
  isOpen,
  onClose,
  onResolved,
}) => {
  const [conflicts, setConflicts] = useState<GitConflictFile[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, 'current' | 'incoming' | 'both'>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConflicts();
    }
  }, [isOpen]);

  const loadConflicts = async () => {
    const list = await GitWorkflowService.getConflicts();
    setConflicts(list);
    const initialResolutions: Record<string, 'current' | 'incoming' | 'both'> = {};
    list.forEach(f => {
      f.conflicts.forEach(b => {
        initialResolutions[b.id] = 'current';
      });
    });
    setResolutions(initialResolutions);
  };

  if (!isOpen) return null;

  const currentFile = conflicts[selectedFileIdx];

  const handleResolveFile = async () => {
    if (!currentFile) return;
    setSaving(true);
    try {
      // Reconstruct file content by applying chosen resolutions
      let resolvedContent = currentFile.rawContent;
      const conflictRegex = /<<<<<<<[^\n]*\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>[^\n]*/g;

      let blockIdx = 0;
      resolvedContent = resolvedContent.replace(conflictRegex, (match, currentPart, incomingPart) => {
        const blockId = `block-${blockIdx++}`;
        const choice = resolutions[blockId] || 'current';
        if (choice === 'current') return currentPart;
        if (choice === 'incoming') return incomingPart;
        return currentPart + incomingPart;
      });

      await GitWorkflowService.resolveConflict(currentFile.filePath, resolvedContent);
      await loadConflicts();
      onResolved?.();
      if (conflicts.length <= 1) {
        onClose();
      }
    } catch (e) {
      logger.error('Failed to resolve conflict:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col text-slate-100 overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Merge Conflict Resolution
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {conflicts.length} conflicted file{conflicts.length > 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Resolve divergence between current branch (HEAD) and incoming changes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {conflicts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Check className="w-8 h-8 text-emerald-400" />
            <p className="font-semibold text-white">No active merge conflicts!</p>
            <p className="text-xs text-slate-500">All working tree paths are clean and merged.</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Conflicted Files List */}
            <div className="w-64 border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                Conflicted Files
              </span>
              {conflicts.map((file, idx) => (
                <button
                  key={file.filePath}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-mono flex items-center justify-between border transition ${
                    idx === selectedFileIdx
                      ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="truncate flex-1">
                    <span className="font-semibold block truncate">{file.filePath.split('/').pop()}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{file.filePath}</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold ml-1 shrink-0">
                    {file.conflicts.length} block{file.conflicts.length > 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Conflict Blocks & Resolution Chooser */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 bg-slate-900/40">
              {currentFile && (
                <>
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl shrink-0">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{currentFile.filePath}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Choose resolution strategy for each conflict hunk below.
                      </p>
                    </div>
                    <button
                      onClick={handleResolveFile}
                      disabled={saving}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{saving ? 'Resolving...' : 'Save & Mark Resolved'}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentFile.conflicts.map((block, bIdx) => {
                      const selected = resolutions[block.id] || 'current';
                      return (
                        <div key={block.id} className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950">
                          {/* Block Resolution Controls */}
                          <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300">Conflict #{bIdx + 1}</span>
                            <div className="flex items-center gap-1 text-[11px]">
                              <button
                                onClick={() => setResolutions(prev => ({ ...prev, [block.id]: 'current' }))}
                                className={`px-2.5 py-1 rounded font-bold transition ${
                                  selected === 'current'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Accept Current (HEAD)
                              </button>
                              <button
                                onClick={() => setResolutions(prev => ({ ...prev, [block.id]: 'incoming' }))}
                                className={`px-2.5 py-1 rounded font-bold transition ${
                                  selected === 'incoming'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Accept Incoming
                              </button>
                              <button
                                onClick={() => setResolutions(prev => ({ ...prev, [block.id]: 'both' }))}
                                className={`px-2.5 py-1 rounded font-bold transition ${
                                  selected === 'both'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Accept Both
                              </button>
                            </div>
                          </div>

                          {/* Conflict Code Comparison */}
                          <div className="grid grid-cols-2 divide-x divide-slate-800 font-mono text-xs leading-5">
                            {/* Current HEAD */}
                            <div className={`p-3 ${selected === 'current' ? 'bg-indigo-950/20' : ''}`}>
                              <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1">
                                <span>Current Change (&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD)</span>
                              </div>
                              <pre className="text-slate-300 whitespace-pre-wrap">{block.currentContent || '<Empty>'}</pre>
                            </div>

                            {/* Incoming */}
                            <div className={`p-3 ${selected === 'incoming' ? 'bg-indigo-950/20' : ''}`}>
                              <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1 flex items-center gap-1">
                                <span>Incoming Change (&gt;&gt;&gt;&gt;&gt;&gt;&gt;)</span>
                              </div>
                              <pre className="text-slate-300 whitespace-pre-wrap">{block.incomingContent || '<Empty>'}</pre>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
