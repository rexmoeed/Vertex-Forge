import React from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import {
  Bot,
  Clock,
  X,
  MessageSquare,
  PanelRight,
  Plus,
} from 'lucide-react';
import { AutonomousProgressCard } from './orchestrator/AutonomousProgressCard';
import { ChatStreamView } from './orchestrator/ChatStreamView';
import { ChatComposerCard } from './orchestrator/ChatComposerCard';
import { OrchestratorModals } from './orchestrator/OrchestratorModals';
import { useAIOrchestrator } from '../../hooks/useAIOrchestrator';

export const AIOrchestratorPanel: React.FC = () => {
  const layout = useLayout();
  const {
    activeFile,
    activeFileContent,
    activeProject,
    openFile,
    cursorMode,
    setCursorMode,
    lastInspectionResult,
    vfs,
    setActiveView,
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
    modifiedFiles,
    setIsMultiFileReviewOpen,
    setIsVoiceModalOpen,
    taskPlan,
  } = useIDE();

  const {
    selectedModel,
    setSelectedModel,
    isModelDropdownOpen,
    setIsModelDropdownOpen,
    projectMemories,
    showMemoryPopover,
    setShowMemoryPopover,
    newMemoryTitle,
    setNewMemoryTitle,
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
    handleCommandSelect,
    handleSendQuery,
    handleAddMemory,
    clearConversation,
    progressPercent,
  } = useAIOrchestrator();

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
      {/* 0. HEADER TAB & CONTROLS */}
      <div
        style={{
          borderColor: 'var(--ide-border)',
        }}
        className="h-9 border-b px-2 flex items-center justify-between select-none bg-black/40 shrink-0"
      >
        <div className="flex items-center gap-1 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-t-md bg-[#18181b] border-t border-x border-white/10 text-xs text-white font-medium shadow-xs">
            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
            <span className="truncate max-w-[120px]">New Agent</span>
            <button
              onClick={clearConversation}
              className="text-slate-400 hover:text-white ml-0.5 cursor-pointer"
              title="Close / Clear Conversation"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={clearConversation}
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

      {/* 1. TOP COMPOSER CARD */}
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

      {/* 3. BOTTOM STATUS FOOTER */}
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

export type { AttachedContextItem } from '../../hooks/orchestrator/useContextAttachments';
