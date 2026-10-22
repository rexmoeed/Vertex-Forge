import React, { useState, RefObject } from 'react';
import {
  FileText,
  Maximize2,
  Code2,
  Terminal,
  ChevronDown,
  Layers,
  CheckCircle2,
  ExternalLink,
  Send,
  Wrench,
  X,
  RefreshCw,
} from 'lucide-react';
import type { InspectionStep } from '../../../types/desktop';
import type { GroundedAIResponse, DataFlowTrace } from '../../../services/codebaseIntelligence';
import type { AttachedContextItem } from '../AIOrchestratorPanel';

export interface OrchestratorMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  inspectionTrail?: InspectionStep[];
  groundedResponse?: GroundedAIResponse;
  dataFlow?: DataFlowTrace;
  attachments?: AttachedContextItem[];
}

import type { InspectionResult } from '../../../types/desktop';

export interface QueuedMessage {
  id: string;
  text: string;
  timestamp?: number;
}

export interface ChatStreamViewProps {
  chatMessages: OrchestratorMessage[];
  lastInspectionResult?: InspectionResult;
  isReasoningOpen: boolean;
  setIsReasoningOpen: (open: boolean) => void;
  modifiedFiles?: unknown[];
  setIsMultiFileReviewOpen?: (open: boolean) => void;
  queuedMessages: QueuedMessage[];
  handleSendQueuedMessage: (id: string) => void;
  handleEditQueuedMessage: (id: string) => void;
  handleDeleteQueuedMessage: (id: string) => void;
  isChatLoading: boolean;
  currentInvestigationStep?: string;
  chatBottomRef: RefObject<HTMLDivElement | null>;
  openFile: (path: string) => void;
  setImageModalUrl: (url: string | null) => void;
}

export const ChatStreamView: React.FC<ChatStreamViewProps> = ({
  chatMessages,
  lastInspectionResult,
  isReasoningOpen,
  setIsReasoningOpen,
  modifiedFiles,
  setIsMultiFileReviewOpen,
  queuedMessages,
  handleSendQueuedMessage,
  handleEditQueuedMessage,
  handleDeleteQueuedMessage,
  isChatLoading,
  currentInvestigationStep,
  chatBottomRef,
  openFile,
  setImageModalUrl,
}) => {
  const [expandedTerminalMessageId, setExpandedTerminalMessageId] = useState<string | null>(null);

  return (
    <>
      {/* Message Stream */}
      {chatMessages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col gap-1 text-xs w-full min-w-0 ${
            msg.role === 'user' ? 'items-end' : 'items-start'
          }`}
        >
          <div
            className={`p-3 rounded-2xl max-w-[98%] min-w-0 break-words leading-relaxed overflow-hidden chat-bubble-contain ${
              msg.role === 'user'
                ? 'bg-[#18181b] text-white border border-slate-800 shadow-sm'
                : 'bg-black/60 border border-slate-800 text-slate-200 shadow-xs'
            }`}
          >
            {/* Attached Context Badges for User Message */}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-white/20">
                {msg.attachments.map(att => (
                  <div key={att.id} className="inline-flex items-center">
                    {att.type === 'file' && (
                      <button
                        type="button"
                        onClick={() => att.filePath && openFile(att.filePath)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-mono transition cursor-pointer"
                        title={`Click to open ${att.filePath} in editor`}
                      >
                        <FileText className="w-3 h-3 text-cyan-200" />
                        <span>{att.title}</span>
                      </button>
                    )}

                    {att.type === 'image' && att.dataUrl && (
                      <div
                        onClick={() => setImageModalUrl(att.dataUrl!)}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/30 max-w-[120px]"
                        title="Click to view image"
                      >
                        <img src={att.dataUrl} alt={att.title} className="w-full h-14 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    {att.type === 'lines' && (
                      <button
                        type="button"
                        onClick={() => att.filePath && openFile(att.filePath)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-400/25 hover:bg-amber-400/35 text-amber-100 border border-amber-300/30 text-[10px] font-mono transition cursor-pointer"
                        title="Click to open file in editor"
                      >
                        <Code2 className="w-3 h-3 text-amber-300" />
                        <span>{att.title}</span>
                      </button>
                    )}

                    {att.type === 'terminal' && (
                      <div className="text-[10px]">
                        <button
                          type="button"
                          onClick={() => setExpandedTerminalMessageId(prev => prev === att.id ? null : att.id)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-400/25 hover:bg-emerald-400/35 text-emerald-100 border border-emerald-300/30 font-mono transition cursor-pointer"
                        >
                          <Terminal className="w-3 h-3 text-emerald-300" />
                          <span>{att.title}</span>
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expandedTerminalMessageId === att.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedTerminalMessageId === att.id && (
                          <pre className="mt-1.5 p-2 rounded bg-slate-950/90 text-emerald-300 font-mono text-[9px] max-h-36 overflow-y-auto whitespace-pre-wrap select-text border border-emerald-500/20">
                            {att.contentSnippet}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="whitespace-pre-wrap break-words break-all max-w-full overflow-hidden leading-relaxed">{msg.content}</p>

            {/* Data Flow Trace Visualization */}
            {msg.dataFlow && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 font-bold text-[11px]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Traced Architecture Data Flow:</span>
                </div>

                <div className="space-y-2 pl-2 border-l border-indigo-300 dark:border-indigo-500/30">
                  {msg.dataFlow.steps.map((st, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{st.layer}:</span>
                        <button
                          onClick={() => openFile(st.filePath)}
                          className="font-mono text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          {st.filePath}
                        </button>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[10px]">{st.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grounded Codebase Evidence Citations */}
            {msg.groundedResponse && msg.groundedResponse.evidence.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Project Evidence:</span>
                </span>

                <div className="grid grid-cols-1 gap-1">
                  {msg.groundedResponse.evidence.map((ev, evIdx) => (
                    <div
                      key={evIdx}
                      onClick={() => openFile(ev.filePath)}
                      className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer flex items-center justify-between text-[10px] transition"
                      title="Click to open verified file in editor"
                    >
                      <span className="font-mono text-indigo-600 dark:text-cyan-300 truncate max-w-[200px]">
                        {ev.filePath}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Real Reasoning & Exploration Steps */}
      {lastInspectionResult && lastInspectionResult.steps && lastInspectionResult.steps.length > 0 && (
        <div className="flex flex-col gap-1.5 my-2 text-xs font-mono select-none">
          <button
            type="button"
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer text-[11px]"
          >
            <span>Exploring {lastInspectionResult.filesInspected?.length || 0} files, {lastInspectionResult.steps.length} searches</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isReasoningOpen ? '' : '-rotate-90'}`} />
          </button>

          {isReasoningOpen && (
            <div className="flex flex-col gap-1 pl-2 text-[10px] text-slate-400 border-l border-white/10 animate-fadeIn">
              {lastInspectionResult.steps.map((st: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => st.file && openFile(st.file)}
                  className="flex items-center gap-1.5 hover:text-[#00ff88] transition cursor-pointer truncate"
                >
                  <span className="opacity-60">{st.action || 'Analyzed'}</span>
                  <span className="text-slate-300">{st.file || st.detail}</span>
                  {st.line && <span className="text-slate-500">#L{st.line}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Bar: Files status & Review Changes */}
      <div className="flex items-center justify-between py-1 text-xs select-none">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
          <span>←</span>
          <span className="truncate max-w-[130px]">{modifiedFiles?.length || 0} Files With ...</span>
        </div>
        <button
          onClick={() => setIsMultiFileReviewOpen?.(true)}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
        >
          <span>Review Changes</span>
        </button>
      </div>

      {/* Queued Messages Section */}
      {queuedMessages.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#121214] border border-slate-800 flex flex-col gap-2 my-2 select-none shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200 text-xs">Queued Messages</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                {queuedMessages.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 truncate max-w-[130px]">Sends after agent fi...</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-0.5">
            {queuedMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-2 rounded-lg bg-black/70 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-2 group"
              >
                <span className="text-[11px] text-slate-300 font-sans truncate flex-1 leading-snug">
                  {msg.text}
                </span>
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => handleSendQueuedMessage(msg.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-[#00ff88] transition cursor-pointer"
                    title="Send Now"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleEditQueuedMessage(msg.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Edit Prompt"
                  >
                    <Wrench className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteQueuedMessage(msg.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Delete from Queue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Investigation Progress Pill */}
      {isChatLoading && (
        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 p-2.5 bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-xl animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{currentInvestigationStep || 'Analyzing workspace context...'}</span>
        </div>
      )}
      <div ref={chatBottomRef} />
    </>
  );
};
