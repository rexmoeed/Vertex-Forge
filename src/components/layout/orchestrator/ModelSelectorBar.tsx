import React from 'react';
import { ChevronDown, Key, Paperclip, Mic, ArrowRight, Square } from 'lucide-react';
import { CursorMode } from '../../../context/IDEContext';

export interface ModelSelectorBarProps {
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean) => void;
  setActiveView: (view: any) => void;
  showAtMenu: boolean;
  setShowAtMenu: (show: boolean) => void;
  setIsVoiceModalOpen?: (open: boolean) => void;
  chatInput: string;
  isChatLoading: boolean;
  setIsChatLoading: (loading: boolean) => void;
  handleSendQuery: () => void;
}

export const ModelSelectorBar: React.FC<ModelSelectorBarProps> = ({
  cursorMode,
  setCursorMode,
  selectedModel,
  setSelectedModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  setActiveView,
  showAtMenu,
  setShowAtMenu,
  setIsVoiceModalOpen,
  chatInput,
  isChatLoading,
  setIsChatLoading,
  handleSendQuery,
}) => {
  return (
    <>
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
        {/* Left Controls: (∞ v) Mode, Model Pill, Lock */}
        <div className="flex items-center gap-1.5">
          {/* Loop / Autonomous Mode Toggle (∞ v) */}
          <button
            type="button"
            onClick={() => setCursorMode(cursorMode === 'agent' ? 'ask' : 'agent')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border transition cursor-pointer ${
              cursorMode === 'agent'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={`Mode: ${cursorMode.toUpperCase()} (Click to toggle Agent/Ask)`}
          >
            <span className="text-xs">∞</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Model Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/5 text-slate-300 hover:text-white text-[11px] font-sans transition cursor-pointer"
              title="Select AI Model"
            >
              <span className="truncate max-w-[115px]">
                {selectedModel === 'gemini-3.8-flash'
                  ? 'Gemini 3.8 Flash'
                  : selectedModel === 'claude-3-7-sonnet'
                  ? 'Claude 3.7 Sonnet'
                  : selectedModel === 'gpt-4o'
                  ? 'GPT-4o Omni'
                  : selectedModel === 'deepseek-r1'
                  ? 'DeepSeek R1'
                  : selectedModel === 'gemini-2.5-pro'
                  ? 'Gemini 2.5 Pro'
                  : selectedModel}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
            </button>
          </div>

          {/* Privacy / BYOK Lock */}
          <button
            type="button"
            onClick={() => setActiveView('providers')}
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 transition cursor-pointer"
            title="API Keys & Model Providers"
          >
            <Key className="w-3 h-3" />
          </button>
        </div>

        {/* Right Controls: Paperclip, Mic, Send */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAtMenu(!showAtMenu)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition cursor-pointer"
            title="Attach Context (@)"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen?.(true)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition cursor-pointer"
            title="Voice Coding (Cmd+Shift+M)"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {(chatInput.trim() || isChatLoading) && (
            <button
              type="button"
              onClick={() => {
                if (isChatLoading) {
                  setIsChatLoading(false);
                } else {
                  handleSendQuery();
                }
              }}
              className={`p-1 rounded-full text-white transition cursor-pointer ${
                isChatLoading ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
              title={isChatLoading ? 'Stop generation' : 'Send message'}
            >
              {isChatLoading ? (
                <Square className="w-2.5 h-2.5 fill-current" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Model Selector Popover */}
      {isModelDropdownOpen && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-[#141416] border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
            Select Model
          </div>
          <div className="space-y-0.5">
            {[
              { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thinking)', badge: 'Default' },
              { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', badge: 'Coding' },
              { id: 'gpt-4o', name: 'GPT-4o Omniscient', badge: 'Multimodal' },
              { id: 'deepseek-r1', name: 'DeepSeek R1', badge: 'Reasoning' },
              { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Analysis)', badge: 'Analysis' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModel(m.id);
                  setIsModelDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  selectedModel === m.id
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[11px]">{m.name}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
          <div className="pt-1 mt-1 border-t border-white/5">
            <button
              onClick={() => {
                setIsModelDropdownOpen(false);
                setActiveView('providers');
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded cursor-pointer"
            >
              <Key className="w-3 h-3" />
              <span>Configure API Keys & Providers</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
