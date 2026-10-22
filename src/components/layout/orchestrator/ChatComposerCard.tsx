import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Terminal,
  Code2,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react';
import { AttachedContextItem } from '../AIOrchestratorPanel';
import { ModelSelectorBar } from './ModelSelectorBar';
import { SkillSetService } from '../../../services/skillSetService';
import { CursorMode } from '../../../context/IDEContext';

export interface ChatComposerCardProps {
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  attachedContexts: AttachedContextItem[];
  setAttachedContexts: React.Dispatch<React.SetStateAction<AttachedContextItem[]>>;
  handleRemoveContext: (id: string) => void;
  handleAttachImage: (file: File) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleSendQuery: () => void;
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  setActiveView: (view: any) => void;
  setIsVoiceModalOpen: (open: boolean) => void;
  isChatLoading: boolean;
  setIsChatLoading: (loading: boolean) => void;
  activeFile: string | null;
  handleAttachFile: (file: string) => void;
  handleToggleTerminalContext: () => void;
  setSelectedFileForLines: (file: string) => void;
  setShowLinePicker: (show: boolean) => void;
  setShowFilePicker: (show: boolean) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ChatComposerCard: React.FC<ChatComposerCardProps> = ({
  chatInput,
  setChatInput,
  textareaRef,
  attachedContexts,
  setAttachedContexts,
  handleRemoveContext,
  handleAttachImage,
  handlePaste,
  handleSendQuery,
  cursorMode,
  setCursorMode,
  selectedModel,
  setSelectedModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  setActiveView,
  setIsVoiceModalOpen,
  isChatLoading,
  setIsChatLoading,
  activeFile,
  handleAttachFile,
  handleToggleTerminalContext,
  setSelectedFileForLines,
  setShowLinePicker,
  setShowFilePicker,
  imageInputRef,
}) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="p-2 border-b border-white/10 bg-[#0e0e11] relative shrink-0">
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
              const file = e.dataTransfer.files[i];
              if (file.type.startsWith('image/')) {
                handleAttachImage(file);
              }
            }
          }
        }}
        className={`relative rounded-xl border border-white/10 bg-[#121214] p-2.5 transition-all focus-within:border-white/25 shadow-inner ${
          isDragOver ? 'ring-1 ring-cyan-500/50 border-cyan-500/60' : ''
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef as any}
          value={chatInput}
          onChange={e => {
            const val = e.target.value;
            setChatInput(val);
            if (val.endsWith('@')) {
              setShowAtMenu(true);
              setShowSlashMenu(false);
            } else if (!val.includes('@')) {
              setShowAtMenu(false);
            }

            if (val.endsWith('/') || (val.startsWith('/') && !val.includes(' '))) {
              setShowSlashMenu(true);
              setShowAtMenu(false);
              setSlashFilter(val.startsWith('/') ? val.slice(1).toLowerCase() : '');
            } else {
              setShowSlashMenu(false);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setShowSlashMenu(false);
              setShowAtMenu(false);
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setShowSlashMenu(false);
              setShowAtMenu(false);
              handleSendQuery();
            }
          }}
          onPaste={handlePaste}
          rows={2}
          placeholder="Plan, Build, / for skills, @ for context"
          className="w-full resize-none bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none leading-relaxed min-h-[46px] font-sans"
        />

        {/* Attached Context Chips Bar */}
        {attachedContexts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 py-1.5 border-t border-white/5 my-1">
            {attachedContexts.map(ctx => (
              <div
                key={ctx.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border shadow-xs transition ${
                  ctx.type === 'file'
                    ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                    : ctx.type === 'image'
                    ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                    : ctx.type === 'terminal'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                }`}
              >
                {ctx.type === 'file' && <FileText className="w-3 h-3 text-indigo-400" />}
                {ctx.type === 'image' &&
                  (ctx.dataUrl ? (
                    <img src={ctx.dataUrl} alt="thumb" className="w-3.5 h-3.5 rounded object-cover" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-purple-400" />
                  ))}
                {ctx.type === 'terminal' && <Terminal className="w-3 h-3 text-emerald-400" />}
                {ctx.type === 'lines' && <Code2 className="w-3 h-3 text-amber-400" />}

                <span className="max-w-[120px] truncate font-mono">{ctx.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveContext(ctx.id)}
                  className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                  title="Remove context item"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setAttachedContexts([])}
              className="text-[9px] text-slate-500 hover:text-rose-400 ml-auto cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Bottom Bar inside Composer Card */}
        <ModelSelectorBar
          cursorMode={cursorMode}
          setCursorMode={setCursorMode}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          setActiveView={setActiveView}
          showAtMenu={showAtMenu}
          setShowAtMenu={setShowAtMenu}
          setIsVoiceModalOpen={setIsVoiceModalOpen}
          chatInput={chatInput}
          isChatLoading={isChatLoading}
          setIsChatLoading={setIsChatLoading}
          handleSendQuery={handleSendQuery}
        />
      </div>

      {/* Floating '/' Slash Command Skills Autocomplete Menu */}
      {showSlashMenu && (
        <div className="absolute top-full left-3 mt-1 w-80 bg-[#141416] border border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in duration-100 max-h-72 flex flex-col">
          <div className="p-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between bg-black/50">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Specialized Coding Skills (/)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSlashMenu(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="p-1 space-y-0.5 text-xs overflow-y-auto">
            {SkillSetService.listSkills()
              .filter(s => s.enabled)
              .filter(s => {
                if (!slashFilter) return true;
                const q = slashFilter.toLowerCase().trim();
                return (
                  s.name.toLowerCase().includes(q) ||
                  s.description.toLowerCase().includes(q) ||
                  s.triggers.some(t => t.pattern.toLowerCase().includes(q))
                );
              })
              .map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    const trigger = skill.triggers.find(t => t.type === 'slash_command')?.pattern || `/${skill.name}`;
                    setChatInput(`${trigger} `);
                    setShowSlashMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-indigo-600/20 hover:text-white text-left transition cursor-pointer group"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5 group-hover:text-cyan-300" />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-indigo-300 group-hover:text-cyan-300">
                        {skill.triggers.find(t => t.type === 'slash_command')?.pattern || `/${skill.name}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">({skill.name})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight line-clamp-1 group-hover:text-slate-200">
                      {skill.description}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Floating '@' Mention Autocomplete Menu */}
      {showAtMenu && (
        <div className="absolute top-full left-3 mt-1 w-64 bg-[#141416] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in duration-100">
          <div className="p-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Insert Context (@)</span>
            <button
              type="button"
              onClick={() => setShowAtMenu(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="p-1 space-y-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowAtMenu(false);
                setShowFilePicker(true);
                setChatInput(prev => prev.replace(/@$/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/5 text-left transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="font-medium text-[11px]">@ File</span>
                <span className="text-[9px] text-slate-400">Search & attach workspace file</span>
              </div>
            </button>

            {activeFile && (
              <button
                type="button"
                onClick={() => {
                  setShowAtMenu(false);
                  handleAttachFile(activeFile);
                  setChatInput(prev => prev.replace(/@$/, ''));
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/5 text-left transition cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="font-medium text-[11px]">@ Active File ({activeFile.split('/').pop()})</span>
                  <span className="text-[9px] text-slate-400">Attach current editor file</span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAtMenu(false);
                handleToggleTerminalContext();
                setChatInput(prev => prev.replace(/@$/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/5 text-left transition cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-medium text-[11px]">@ Terminal</span>
                <span className="text-[9px] text-slate-400">Include recent shell logs & errors</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAtMenu(false);
                setSelectedFileForLines(activeFile || 'src/App.tsx');
                setShowLinePicker(true);
                setChatInput(prev => prev.replace(/@$/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/5 text-left transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="font-medium text-[11px]">@ Line References</span>
                <span className="text-[9px] text-slate-400">Reference specific line range</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAtMenu(false);
                imageInputRef.current?.click();
                setChatInput(prev => prev.replace(/@$/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-white/5 text-left transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <div className="flex flex-col">
                <span className="font-medium text-[11px]">@ Image</span>
                <span className="text-[9px] text-slate-400">Upload screenshot or mockup</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
