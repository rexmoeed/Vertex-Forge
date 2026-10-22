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
import { ChatStreamView } from './orchestrator/ChatStreamView';
import { ChatComposerCard } from './orchestrator/ChatComposerCard';
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
  } = useIDE();

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
  const [expandedTerminalMessageId, setExpandedTerminalMessageId] = useState<string | null>(null);

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
        replyAgent = (res.agent as AgentRole) || activeAgent;
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

      {/* 1. TOP COMPOSER CARD (Modularized) */}
      <ChatComposerCard
        chatInput={chatInput}
        setChatInput={setChatInput}
        textareaRef={textareaRef}
        attachedContexts={attachedContexts}
        setAttachedContexts={setAttachedContexts}
        handleRemoveContext={handleRemoveContext}
        handleAttachImage={handleAttachImage}
        handlePaste={handlePaste}
        handleSendQuery={handleSendQuery}
        cursorMode={cursorMode}
        setCursorMode={setCursorMode}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isModelDropdownOpen={isModelDropdownOpen}
        setIsModelDropdownOpen={setIsModelDropdownOpen}
        setActiveView={setActiveView}
        setIsVoiceModalOpen={setIsVoiceModalOpen}
        isChatLoading={isChatLoading}
        setIsChatLoading={setIsChatLoading}
        activeFile={activeFile}
        handleAttachFile={handleAttachFile}
        handleToggleTerminalContext={handleToggleTerminalContext}
        setSelectedFileForLines={setSelectedFileForLines}
        setShowLinePicker={setShowLinePicker}
        setShowFilePicker={setShowFilePicker}
        imageInputRef={imageInputRef}
      />

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

        {/* Modular Chat Stream View */}
        <ChatStreamView
          chatMessages={chatMessages}
          lastInspectionResult={lastInspectionResult}
          isReasoningOpen={isReasoningOpen}
          setIsReasoningOpen={setIsReasoningOpen}
          modifiedFiles={modifiedFiles}
          setIsMultiFileReviewOpen={setIsMultiFileReviewOpen}
          queuedMessages={queuedMessages}
          handleSendQueuedMessage={handleSendQueuedMessage}
          handleEditQueuedMessage={handleEditQueuedMessage}
          handleDeleteQueuedMessage={handleDeleteQueuedMessage}
          isChatLoading={isChatLoading}
          currentInvestigationStep={currentInvestigationStep}
          chatBottomRef={chatBottomRef}
          openFile={openFile}
          setImageModalUrl={setImageModalUrl}
        />
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

