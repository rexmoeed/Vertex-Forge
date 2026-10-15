import React, { useState, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import {
  BrainCircuit,
  X,
  Check,
  Save,
  FileCode,
  Sparkles,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { CursorService } from '../../services/cursorService';

interface CursorRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CursorRulesModal: React.FC<CursorRulesModalProps> = ({ isOpen, onClose }) => {
  const { vfs, activeProject } = useIDE() as any;

  const [rulesContent, setRulesContent] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = vfs.readFile('.cursorrules') || vfs.readFile('.vertexrules');
      if (existing) {
        setRulesContent(existing);
      } else {
        setRulesContent(CursorService.getDefaultCursorRules());
      }
    }
  }, [isOpen, vfs]);

  if (!isOpen) return null;

  const handleSave = () => {
    vfs.writeFile('.cursorrules', rulesContent);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    setRulesContent(CursorService.getDefaultCursorRules());
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Project AI Rules (<span className="text-cyan-400 font-mono">.cursorrules</span>)
              </h2>
              <p className="text-[11px] text-slate-400">
                Define persistent architecture conventions, style rules, and coding standards for all AI models.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-4 flex flex-col gap-2.5 bg-slate-950/90">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Workspace: {activeProject?.name || 'Current Project'}</span>
            <button
              onClick={handleResetDefault}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Load Best-Practice Template</span>
            </button>
          </div>

          <textarea
            value={rulesContent}
            onChange={e => setRulesContent(e.target.value)}
            rows={14}
            className="w-full bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none leading-relaxed resize-none shadow-inner"
            placeholder="Write architecture standards, naming conventions, or libraries to use..."
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
          {savedNotice ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5 font-mono">
              <Check className="w-4 h-4" />
              Saved .cursorrules to workspace!
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              Automatically injected into every Composer & Chat query
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
