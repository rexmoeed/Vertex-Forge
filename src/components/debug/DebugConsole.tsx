import React, { useState, useRef, useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import { Terminal, Send, Trash2, Search, ArrowRight } from 'lucide-react';
import { DebugConsoleMessage } from '../../types/debugger';

export const DebugConsole: React.FC = () => {
  const { debuggerEngine, debugConsoleMessages } = useIDE();
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages: DebugConsoleMessage[] = debugConsoleMessages || debuggerEngine?.getConsoleMessages() || [];

  const filtered = filter.trim()
    ? messages.filter((m: DebugConsoleMessage) => m.text.toLowerCase().includes(filter.toLowerCase()))
    : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    debuggerEngine?.evaluateInConsole(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 font-mono text-xs select-none">
      {/* Top Console Toolbar */}
      <div className="h-8 border-b border-slate-800 px-3 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-[11px] text-slate-300">Debug Console REPL</span>
          <span className="text-[10px] text-slate-500">({messages.length} logs)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px]">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter console..."
              className="bg-transparent text-white outline-none w-24 text-[10px]"
            />
          </div>

          <button
            onClick={() => debuggerEngine?.clearConsole()}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="text-slate-500 italic p-4 text-center">
            Debug console ready. Execute scripts or enter expressions below to evaluate in paused scope.
          </div>
        ) : (
          filtered.map((msg: DebugConsoleMessage) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 py-0.5 ${
                msg.category === 'stderr'
                  ? 'text-rose-400'
                  : msg.category === 'system'
                  ? 'text-cyan-400'
                  : msg.category === 'input'
                  ? 'text-indigo-300 font-bold'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-[9px] text-slate-600 shrink-0 select-none">
                {msg.timestamp}
              </span>
              <span className="whitespace-pre-wrap break-all flex-1">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive REPL Prompt */}
      <form
        onSubmit={handleEvaluate}
        className="p-2 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2 shrink-0"
      >
        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Evaluate expression in paused context (e.g. prices[0] + 5, total)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition cursor-pointer shadow"
          title="Evaluate Expression"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
