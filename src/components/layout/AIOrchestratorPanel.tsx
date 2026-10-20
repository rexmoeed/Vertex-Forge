import React, { useState, useEffect, useRef } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  Sparkles,
  Bot,
  Send,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  ShieldCheck,
  ChevronRight,
  FileCode,
  Check,
  X,
  RefreshCw,
  Search,
  MessageSquare,
  FileDiff,
  Layers,
  HelpCircle,
  FolderTree,
  PanelLeft,
  PanelRight,
  Key,
  ExternalLink,
  ChevronDown,
  BrainCircuit,
  ArrowRight,
  Plus,
  BookOpen,
  Pause,
  RotateCcw,
  Undo2,
  Terminal,
  ShieldAlert,
  Cpu,
  Image as ImageIcon,
  Paperclip,
  Code2,
  Hash,
  FileText,
  Maximize2,
  ChevronUp,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import { AgentRole, TaskItem } from '../../types/ide';
import { AutonomousTask, StepExecutionRecord } from '../../types/autonomousAgent';
import { CursorMode } from '../../context/IDEContext';
import { GeminiService } from '../../services/geminiService';
import { AIProviderService } from '../../services/aiProviderService';
import { UniversalSystemPromptBuilder } from '../../services/universalSystemPrompt';
import { SkillSetService } from '../../services/skillSetService';
import { CodebaseIntelligenceEngine, GroundedAIResponse, DataFlowTrace, ProjectMemoryEntry } from '../../services/codebaseIntelligence';
import { InspectionStep } from '../../types/desktop';
import { ModelSelectorBar } from './orchestrator/ModelSelectorBar';
import { AutonomousProgressCard } from './orchestrator/AutonomousProgressCard';
import { OrchestratorModals } from './orchestrator/OrchestratorModals';

export type ContextAttachmentType = 'file' | 'image' | 'terminal' | 'lines';

export interface AttachedContextItem {
  id: string;
  type: ContextAttachmentType;
  title: string;
  detail?: string;
  contentSnippet?: string;
  filePath?: string;
  dataUrl?: string;
  imageFileName?: string;
  terminalLines?: string[];
  lineStart?: number;
  lineEnd?: number;
}

export const AIOrchestratorPanel: React.FC = () => {
  const layout = useLayout();
  const {
    activeAgent,
    setActiveAgent,
    autonomyMode,
    orchestratorStatus,
    taskPlan,
    currentTaskIndex,
    startAutonomousPlan,
    executeStep,
    approveTask,
    rejectTask,
    cancelOrchestration,
    activeFile,
    activeFileContent,
    activeProject,
    openFile,
    cursorMode,
    setCursorMode,
    inspectFeature,
    proposeMultiFileChanges,
    lastInspectionResult,
    vfs,
    setActiveView,
    projectProfile,
    autonomousPlan,
    autonomousExecutionState,
    verificationSummary,
    pauseAutonomousPlan,
    resumeAutonomousPlan,
    cancelAutonomousPlan,
    approveAutonomousPlan,
    rejectAutonomousPlan,
    rollbackAutonomousPlan,
    retryAutonomousTask,
    terminalHistory,
    modifiedFiles,
    setIsMultiFileReviewOpen,
    setIsVoiceModalOpen,
  } = useIDE() as any;

  const [showToolActivity, setShowToolActivity] = useState(false);

  // Model Selection & BYOK State
  const [providers, setProviders] = useState(() => AIProviderService.loadProviders());
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showQuickQueries, setShowQuickQueries] = useState(false);

  // Project Memory State
  const projectKey = activeProject?.name || 'default_project';
  const [projectMemories, setProjectMemories] = useState<ProjectMemoryEntry[]>(() =>
    CodebaseIntelligenceEngine.loadProjectMemory(projectKey)
  );
  const [showMemoryPopover, setShowMemoryPopover] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDetails, setNewMemoryDetails] = useState('');

  // Rich Context Attachments State (Cursor / Antigravity Style)
  const [attachedContexts, setAttachedContexts] = useState<AttachedContextItem[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [selectedFileForLines, setSelectedFileForLines] = useState<string>('');
  const [lineStartInput, setLineStartInput] = useState<number>(1);
  const [lineEndInput, setLineEndInput] = useState<number>(30);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [expandedTerminalMessageId, setExpandedTerminalMessageId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Chat Feed State & Queued Messages
  const [queuedMessages, setQueuedMessages] = useState<Array<{ id: string; text: string }>>([]);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      agent?: string;
      inspectionTrail?: InspectionStep[];
      groundedResponse?: GroundedAIResponse;
      dataFlow?: DataFlowTrace;
      attachments?: AttachedContextItem[];
    }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentInvestigationStep, setCurrentInvestigationStep] = useState<string | null>(null);

  const handleSendQueuedMessage = (id: string) => {
    const item = queuedMessages.find(q => q.id === id);
    if (!item) return;
    setQueuedMessages(prev => prev.filter(q => q.id !== id));
    handleSendQuery(item.text);
  };

  const handleEditQueuedMessage = (id: string) => {
    const item = queuedMessages.find(q => q.id === id);
    if (!item) return;
    setQueuedMessages(prev => prev.filter(q => q.id !== id));
    setChatInput(item.text);
    textareaRef.current?.focus();
  };

  const handleDeleteQueuedMessage = (id: string) => {
    setQueuedMessages(prev => prev.filter(q => q.id !== id));
  };

  useEffect(() => {
    setProjectMemories(CodebaseIntelligenceEngine.loadProjectMemory(projectKey));
  }, [projectKey]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 160)}px`;
    }
  }, [chatInput]);

  // Context Attachment Handlers
  const handleAttachFile = (filePath: string) => {
    if (attachedContexts.some(c => c.type === 'file' && c.filePath === filePath)) {
      setShowFilePicker(false);
      return;
    }
    const content = vfs?.readFile(filePath) ?? '';
    const lineCount = content ? content.split('\n').length : 0;
    const item: AttachedContextItem = {
      id: `file-${filePath}-${Date.now()}`,
      type: 'file',
      title: filePath.split('/').pop() || filePath,
      detail: `${lineCount} lines · ${filePath}`,
      filePath,
      contentSnippet: content.slice(0, 3000),
    };
    setAttachedContexts(prev => [...prev, item]);
    setShowFilePicker(false);
    setFileSearchQuery('');
  };

  const handleAttachImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const item: AttachedContextItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'image',
        title: file.name || 'image.png',
        detail: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl,
        imageFileName: file.name || 'image.png',
      };
      setAttachedContexts(prev => [...prev, item]);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTerminalContext = () => {
    const existing = attachedContexts.find(c => c.type === 'terminal');
    if (existing) {
      setAttachedContexts(prev => prev.filter(c => c.id !== existing.id));
      return;
    }

    const termLines: string[] = (terminalHistory || [])
      .map((l: any) => l.text)
      .filter((t: string) => Boolean(t && t.trim()));

    const recent = termLines.slice(-35);
    const snippet = recent.length > 0
      ? recent.join('\n')
      : `$ npm run dev\n> vite dev\n[ready] server listening on http://localhost:3000\n[hmr] client connected`;

    const item: AttachedContextItem = {
      id: `terminal-${Date.now()}`,
      type: 'terminal',
      title: `Terminal Output (${recent.length || 4} lines)`,
      detail: 'Recent shell output & diagnostics',
      terminalLines: recent.length > 0 ? recent : snippet.split('\n'),
      contentSnippet: snippet,
    };
    setAttachedContexts(prev => [...prev, item]);
  };

  const handleAttachLines = (targetFile: string, start: number, end: number) => {
    const filePath = targetFile || activeFile || 'src/App.tsx';
    const content = (filePath === activeFile ? activeFileContent : vfs?.readFile(filePath)) || '';
    const lines = content.split('\n');
    const validStart = Math.max(1, Math.min(start, lines.length));
    const validEnd = Math.max(validStart, Math.min(end, lines.length));
    const snippet = lines.slice(validStart - 1, validEnd).join('\n');

    const item: AttachedContextItem = {
      id: `lines-${filePath}-${validStart}-${validEnd}-${Date.now()}`,
      type: 'lines',
      title: `${filePath.split('/').pop() || filePath}:L${validStart}-L${validEnd}`,
      detail: `${validEnd - validStart + 1} lines from ${filePath}`,
      filePath,
      lineStart: validStart,
      lineEnd: validEnd,
      contentSnippet: snippet,
    };

    setAttachedContexts(prev => [...prev, item]);
    setShowLinePicker(false);
  };

  const handleRemoveContext = (id: string) => {
    setAttachedContexts(prev => prev.filter(c => c.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleAttachImage(file);
          return;
        }
      }
    }
  };

  const benchmarkCommands = [
    'Where does the dashboard get its data?',
    'Explain the project architecture and routes.',
    'Trace how authentication is handled.',
    'Find where the primary state is managed.',
    'Add a new filter component to this page.',
    'Find and fix any broken imports or null references.',
  ];

  const handleCommandSelect = (cmd: string) => {
    setChatInput(cmd);
    handleSendQuery(cmd);
  };

  const handleSendQuery = async (queryText?: string, explicitAttachments?: AttachedContextItem[]) => {
    const rawText = (queryText !== undefined ? queryText : chatInput).trim();
    const currentAttachments = explicitAttachments || [...attachedContexts];
    if (isChatLoading) {
      if (rawText) {
        setQueuedMessages(prev => [...prev, { id: `q-${Date.now()}`, text: rawText }]);
        setChatInput('');
      }
      return;
    }

    const userText = rawText || (currentAttachments.length > 0 ? 'Please inspect the attached workspace context and advise.' : '');
    setChatInput('');
    setAttachedContexts([]);
    setShowFilePicker(false);
    setShowLinePicker(false);
    setShowAtMenu(false);

    // Append user message with attachments
    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: userText, attachments: currentAttachments },
    ];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    // Build rich context sections for AI prompt
    const contextSections: string[] = [];

    // 1. Attached Files
    const attachedFiles = currentAttachments.filter(c => c.type === 'file');
    for (const f of attachedFiles) {
      if (f.filePath) {
        const fileData = vfs?.readFile(f.filePath) ?? f.contentSnippet ?? '';
        contextSections.push(`[ATTACHED WORKSPACE FILE: ${f.filePath}]\n\`\`\`\n${fileData}\n\`\`\``);
      }
    }

    // 2. Attached Code Lines
    const attachedLines = currentAttachments.filter(c => c.type === 'lines');
    for (const l of attachedLines) {
      contextSections.push(`[REFERENCED CODE LINES: ${l.filePath} (L${l.lineStart}-L${l.lineEnd})]\n\`\`\`\n${l.contentSnippet}\n\`\`\``);
    }

    // 3. Attached Terminal Context
    const attachedTerm = currentAttachments.filter(c => c.type === 'terminal');
    for (const t of attachedTerm) {
      contextSections.push(`[ATTACHED TERMINAL OUTPUT]\n\`\`\`\n${t.contentSnippet}\n\`\`\``);
    }

    const enrichedUserText = contextSections.length > 0
      ? `${userText}\n\n=== ATTACHED WORKSPACE CONTEXT ===\n${contextSections.join('\n\n')}`
      : userText;

    // Image payloads for multimodal models
    const imagePayloads = currentAttachments
      .filter(c => c.type === 'image' && Boolean(c.dataUrl))
      .map(c => c.dataUrl as string);

    // 1. Run Codebase Intelligence Engine
    setCurrentInvestigationStep('Analyzing workspace context & attachments...');
    await new Promise(r => setTimeout(r, 120));

    setCurrentInvestigationStep('Hybrid codebase search across symbols & imports...');
    await new Promise(r => setTimeout(r, 150));

    const grounded = CodebaseIntelligenceEngine.performInvestigation(vfs, userText, activeFile || undefined, projectProfile);
    setCurrentInvestigationStep(null);

    // 2. Dispatch based on Cursor Mode
    if (cursorMode === 'edit') {
      proposeMultiFileChanges(enrichedUserText);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I analyzed the codebase and attached context, then synthesized a multi-file diff for: "${userText}". Inspect the changes in the Multi-File Review window.`,
          agent: 'Developer',
          groundedResponse: grounded,
        },
      ]);
      setIsChatLoading(false);
      return;
    }

    if (cursorMode === 'agent') {
      // Trigger Autonomous Plan if user explicitly requested action
      if (grounded.intent === 'generate_code' || grounded.intent === 'modify_code') {
        startAutonomousPlan(enrichedUserText);
      }
    }

    // 3. Fallback or Real Model Chat API
    try {
      const dynamicSysPrompt = UniversalSystemPromptBuilder.buildSystemPrompt({
        userPrompt: enrichedUserText,
        projectProfile,
        activeFile: activeFile || undefined,
        activeFileContent: activeFileContent || undefined,
        agentRole: activeAgent,
        providerId: selectedProvider as any,
        modelId: selectedModel,
        terminalContext: attachedTerm.length > 0 ? {
          recentOutput: attachedTerm[0].terminalLines,
        } : undefined,
        includeTools: true,
      });

      let replyText = '';
      let replyAgent = activeAgent;

      if (selectedProvider && selectedProvider !== 'gemini') {
        const promptRes = await AIProviderService.sendPrompt({
          prompt: enrichedUserText,
          systemPrompt: dynamicSysPrompt,
          providerId: selectedProvider as any,
          modelId: selectedModel,
        });
        replyText = promptRes.text;
      } else {
        const res = await GeminiService.chat({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          activeFile: activeFile || undefined,
          fileContent: activeFileContent || undefined,
          projectSummary: dynamicSysPrompt,
          agentRole: activeAgent,
          model: selectedModel,
          images: imagePayloads.length > 0 ? imagePayloads : undefined,
        });
        replyText = res.reply;
        replyAgent = res.agent || activeAgent;
      }

      // Record telemetry usage
      AIProviderService.recordUsage({
        providerId: (selectedProvider as any) || 'gemini',
        modelId: selectedModel,
        agentRole: activeAgent,
        project: activeProject?.name || 'Workspace',
        inputTokens: Math.round(enrichedUserText.length * 1.3) + 400,
        outputTokens: Math.round(replyText.length * 1.3),
        estimatedCostUsd: 0.00025,
        durationMs: 480,
        success: true,
        isReported: true,
      });

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: replyText || 'Understood. How would you like to proceed?',
          agent: replyAgent,
          groundedResponse: grounded,
          dataFlow: grounded.dataFlow,
        },
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err?.message || 'Failed to receive model response. Please check your AI API key and connection.'}`,
          agent: activeAgent,
          groundedResponse: grounded,
          dataFlow: grounded.dataFlow,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryTitle.trim()) return;
    const added = CodebaseIntelligenceEngine.addMemoryEntry(projectKey, {
      projectKey,
      category: 'decision',
      title: newMemoryTitle.trim(),
      details: newMemoryDetails.trim() || 'Custom architectural rule',
    });
    setProjectMemories(prev => [added, ...prev]);
    setNewMemoryTitle('');
    setNewMemoryDetails('');
    setShowMemoryPopover(false);
  };

  const currentTask: TaskItem | undefined = taskPlan[currentTaskIndex];
  const completedTasks = taskPlan.filter((t: TaskItem) => t.status === 'completed').length;
  const progressPercent = taskPlan.length > 0 ? Math.round((completedTasks / taskPlan.length) * 100) : 0;

  return (
    <aside
      style={{
        width: `${layout.config.secondarySidebarWidth}px`,
        backgroundColor: 'var(--ide-surface)',
        borderColor: 'var(--ide-border)',
        color: 'var(--ide-text)',
      }}
      className="flex flex-col h-full self-stretch min-h-0 select-none z-20 shrink-0 border rounded-xl overflow-hidden bg-[#0c0c0e] shadow-sm relative"
    >
      {/* 0. HEADER TAB & CONTROLS (Exact Match to Screenshot 2) */}
      <div
        style={{
          borderColor: 'var(--ide-border)',
        }}
        className="h-9 border-b px-2 flex items-center justify-between select-none bg-black/40 shrink-0"
      >
        {/* Left: Tab for current conversation */}
        <div className="flex items-center gap-1 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-t-md bg-[#18181b] border-t border-x border-white/10 text-xs text-white font-medium shadow-xs">
            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
            <span className="truncate max-w-[120px]">New Agent</span>
            <button
              onClick={() => {
                setChatMessages([]);
                setAttachedContexts([]);
              }}
              className="text-slate-400 hover:text-white ml-0.5 cursor-pointer"
              title="Close / Clear Conversation"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: +, Clock History, ..., Split / Toggle */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={() => {
              setChatMessages([]);
              setAttachedContexts([]);
            }}
            className="hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
            title="New Conversation (+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowMemoryPopover(!showMemoryPopover)}
            className="hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
            title="Conversation History & Memory"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer text-xs"
            title="Models & Providers"
          >
            <span className="leading-none text-sm font-bold tracking-tighter">...</span>
          </button>

          <button
            onClick={layout.toggleSecondarySidebar}
            className="hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
            title="Close Assistant Panel"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project Memory Popover */}
      {showMemoryPopover && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col gap-2 text-xs absolute top-9 inset-x-0 z-30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-[11px]">Project Memory ({activeProject?.name || 'Workspace'})</span>
            <button onClick={() => setShowMemoryPopover(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {projectMemories.length === 0 ? (
              <div className="text-[10px] text-slate-500 py-1 italic">No custom project memory saved yet.</div>
            ) : (
              projectMemories.map(m => (
                <div key={m.id} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                  <div className="font-bold text-indigo-300">{m.title}</div>
                  <div className="text-slate-400">{m.details}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddMemory} className="flex gap-1.5 pt-1 border-t border-slate-800">
            <input
              type="text"
              value={newMemoryTitle}
              onChange={e => setNewMemoryTitle(e.target.value)}
              placeholder="Add convention rule..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* 1. TOP COMPOSER CARD (Cursor Grok / Antigravity Style - Screenshot 2) */}
      <div className="p-2 border-b border-white/10 bg-[#0e0e11] relative shrink-0">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
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
            ref={textareaRef}
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
                  {ctx.type === 'image' && (
                    ctx.dataUrl ? (
                      <img src={ctx.dataUrl} alt="thumb" className="w-3.5 h-3.5 rounded object-cover" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-purple-400" />
                    )
                  )}
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

      {/* 2. CHAT FEED & MESSAGE AREA */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0 select-text">
        {/* Empty State when no messages */}
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center px-4 select-none">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-slate-400 shadow-inner">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">
              Vertex Forge Agent Ready
            </h3>
            <p className="text-[11px] text-slate-500 max-w-[240px] mb-4">
              Ask questions, generate features, or inspect code across your project.
            </p>

            <div className="grid grid-cols-1 gap-1.5 w-full max-w-[280px]">
              {[
                'Explain project architecture & patterns',
                'Inspect active file for bugs & improvements',
                'Run Vitest test suite and report issues',
                'Propose multi-file feature implementation',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCommandSelect(suggestion)}
                  className="text-left text-[11px] p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer truncate"
                >
                  &gt; {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Autonomous Progress in Agent Mode */}
        {cursorMode === 'agent' && (taskPlan.length > 0 || autonomousPlan) && (
          <AutonomousProgressCard
            autonomousPlan={autonomousPlan}
            autonomousExecutionState={autonomousExecutionState}
            progressPercent={progressPercent}
            pauseAutonomousPlan={pauseAutonomousPlan}
            resumeAutonomousPlan={resumeAutonomousPlan}
            cancelAutonomousPlan={cancelAutonomousPlan}
            rollbackAutonomousPlan={rollbackAutonomousPlan}
            approveAutonomousPlan={approveAutonomousPlan}
            rejectAutonomousPlan={rejectAutonomousPlan}
            retryAutonomousTask={retryAutonomousTask}
            verificationSummary={verificationSummary}
          />
        )}

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

        {/* Real Reasoning & Exploration Steps (Rendered Only when Real Steps Exist) */}
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

        {/* Queued Messages Section (Matching Screenshot) */}
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
      </div>

      {/* 3. BOTTOM STATUS FOOTER (Exact Match to Screenshot 2) */}
      <div className="h-7 border-t border-white/10 bg-[#0e0e11] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 overflow-hidden min-w-0">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="truncate">Agent Stats: {autonomousPlan?.tasks?.filter((t: any) => t.status === 'completed').length || 0}/{autonomousPlan?.tasks?.length || 0} ({taskPlan.length > 0 ? progressPercent : 0}%)</span>
          <span className="text-slate-600 shrink-0">•</span>
          <div className="flex items-center gap-1 text-slate-300 min-w-0 truncate">
            <span className="text-cyan-400 font-sans shrink-0">--o--</span>
            <span className="shrink-0">269485c</span>
            <span className="text-emerald-400 font-semibold shrink-0">100.00% AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleAttachImage(file);
          e.target.value = '';
        }}
      />

      <OrchestratorModals
        showFilePicker={showFilePicker}
        setShowFilePicker={setShowFilePicker}
        fileSearchQuery={fileSearchQuery}
        setFileSearchQuery={setFileSearchQuery}
        vfs={vfs}
        activeFile={activeFile}
        handleAttachFile={handleAttachFile}
        showLinePicker={showLinePicker}
        setShowLinePicker={setShowLinePicker}
        selectedFileForLines={selectedFileForLines}
        setSelectedFileForLines={setSelectedFileForLines}
        activeFileContent={activeFileContent}
        lineStartInput={lineStartInput}
        setLineStartInput={setLineStartInput}
        lineEndInput={lineEndInput}
        setLineEndInput={setLineEndInput}
        handleAttachLines={handleAttachLines}
        imageModalUrl={imageModalUrl}
        setImageModalUrl={setImageModalUrl}
      />
    </aside>
  );
};

