import { useState, useEffect, useRef } from 'react';
import { useIDE } from '../context/IDEContext';
import { AgentRole, TaskItem } from '../types/ide';
import { GeminiService } from '../services/geminiService';
import { AIProviderService } from '../services/aiProviderService';
import { UniversalSystemPromptBuilder } from '../services/universalSystemPrompt';
import { CodebaseIntelligenceEngine, GroundedAIResponse, DataFlowTrace, ProjectMemoryEntry } from '../services/codebaseIntelligence';
import { InspectionStep } from '../types/desktop';
import { logger } from '../services/logger';
import { useContextAttachments, AttachedContextItem } from './orchestrator/useContextAttachments';

export type { ContextAttachmentType, AttachedContextItem } from './orchestrator/useContextAttachments';

export function useAIOrchestrator() {
  const {
    activeAgent,
    activeFile,
    activeFileContent,
    activeProject,
    cursorMode,
    proposeMultiFileChanges,
    vfs,
    projectProfile,
    startAutonomousPlan,
    terminalHistory,
    taskPlan,
    currentTaskIndex,
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

  // Rich Context Attachments Hook
  const {
    attachedContexts,
    setAttachedContexts,
    showFilePicker,
    setShowFilePicker,
    fileSearchQuery,
    setFileSearchQuery,
    showLinePicker,
    setShowLinePicker,
    selectedFileForLines,
    setSelectedFileForLines,
    lineStartInput,
    setLineStartInput,
    lineEndInput,
    setLineEndInput,
    imageModalUrl,
    setImageModalUrl,
    expandedTerminalMessageId,
    setExpandedTerminalMessageId,
    imageInputRef,
    handleAttachFile,
    handleAttachImage,
    handleToggleTerminalContext,
    handleAttachLines,
    handleRemoveContext,
    handlePaste,
  } = useContextAttachments({
    vfs,
    activeFile,
    activeFileContent,
    terminalHistory,
  });

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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 160)}px`;
    }
  }, [chatInput]);

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

    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: userText, attachments: currentAttachments },
    ];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    const contextSections: string[] = [];

    const attachedFiles = currentAttachments.filter(c => c.type === 'file');
    for (const f of attachedFiles) {
      if (f.filePath) {
        const fileData = vfs?.readFile(f.filePath) ?? f.contentSnippet ?? '';
        contextSections.push(`[ATTACHED WORKSPACE FILE: ${f.filePath}]\n\`\`\`\n${fileData}\n\`\`\``);
      }
    }

    const attachedLines = currentAttachments.filter(c => c.type === 'lines');
    for (const l of attachedLines) {
      contextSections.push(`[REFERENCED CODE LINES: ${l.filePath} (L${l.lineStart}-L${l.lineEnd})]\n\`\`\`\n${l.contentSnippet}\n\`\`\``);
    }

    const attachedTerm = currentAttachments.filter(c => c.type === 'terminal');
    for (const t of attachedTerm) {
      contextSections.push(`[ATTACHED TERMINAL OUTPUT]\n\`\`\`\n${t.contentSnippet}\n\`\`\``);
    }

    const enrichedUserText = contextSections.length > 0
      ? `${userText}\n\n=== ATTACHED WORKSPACE CONTEXT ===\n${contextSections.join('\n\n')}`
      : userText;

    const imagePayloads = currentAttachments
      .filter(c => c.type === 'image' && Boolean(c.dataUrl))
      .map(c => c.dataUrl as string);

    setCurrentInvestigationStep('Analyzing workspace context & attachments...');
    await new Promise(r => setTimeout(r, 80));

    const grounded = CodebaseIntelligenceEngine.performInvestigation(vfs, userText, activeFile || undefined, projectProfile);
    setCurrentInvestigationStep(null);

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
      if (grounded.intent === 'generate_code' || grounded.intent === 'modify_code') {
        startAutonomousPlan(enrichedUserText);
      }
    }

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Chat generation failed: ${msg}`, { err });
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${msg || 'Failed to receive model response. Please check your AI API key and connection.'}`,
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

  const clearConversation = () => {
    setChatMessages([]);
    setAttachedContexts([]);
  };

  const currentTask: TaskItem | undefined = taskPlan[currentTaskIndex];
  const completedTasks = taskPlan.filter((t: TaskItem) => t.status === 'completed').length;
  const progressPercent = taskPlan.length > 0 ? Math.round((completedTasks / taskPlan.length) * 100) : 0;

  return {
    showToolActivity,
    setShowToolActivity,
    providers,
    setProviders,
    selectedModel,
    setSelectedModel,
    selectedProvider,
    setSelectedProvider,
    isModelDropdownOpen,
    setIsModelDropdownOpen,
    showQuickQueries,
    setShowQuickQueries,
    projectMemories,
    showMemoryPopover,
    setShowMemoryPopover,
    newMemoryTitle,
    setNewMemoryTitle,
    newMemoryDetails,
    setNewMemoryDetails,
    attachedContexts,
    setAttachedContexts,
    showFilePicker,
    setShowFilePicker,
    fileSearchQuery,
    setFileSearchQuery,
    showLinePicker,
    setShowLinePicker,
    selectedFileForLines,
    setSelectedFileForLines,
    lineStartInput,
    setLineStartInput,
    lineEndInput,
    setLineEndInput,
    imageModalUrl,
    setImageModalUrl,
    expandedTerminalMessageId,
    setExpandedTerminalMessageId,
    imageInputRef,
    textareaRef,
    chatBottomRef,
    queuedMessages,
    isReasoningOpen,
    setIsReasoningOpen,
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    setIsChatLoading,
    currentInvestigationStep,
    handleSendQueuedMessage,
    handleEditQueuedMessage,
    handleDeleteQueuedMessage,
    handleAttachFile,
    handleAttachImage,
    handleToggleTerminalContext,
    handleAttachLines,
    handleRemoveContext,
    handlePaste,
    benchmarkCommands,
    handleCommandSelect,
    handleSendQuery,
    handleAddMemory,
    clearConversation,
    currentTask,
    progressPercent,
  };
}
