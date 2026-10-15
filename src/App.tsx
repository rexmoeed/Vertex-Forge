/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IDEProvider, useIDE } from './context/IDEContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { TopMenuBar } from './components/layout/TopMenuBar';
import { ActivityBar } from './components/layout/ActivityBar';
import { Sidebar } from './components/layout/Sidebar';
import { EditorArea } from './components/layout/EditorArea';
import { BottomPanel } from './components/layout/BottomPanel';
import { StatusBar } from './components/layout/StatusBar';
import { AIOrchestratorPanel } from './components/layout/AIOrchestratorPanel';
import { PreviewPanel } from './components/layout/PreviewPanel';
import { Splitter } from './components/layout/Splitter';
import { ProjectCreationWizard } from './components/modals/ProjectCreationWizard';
import { MultiFileReviewModal } from './components/modals/MultiFileReviewModal';
import { AcceptanceTestRunnerModal } from './components/workspace/AcceptanceTestRunner';
import { ProjectControlPanel } from './components/workspace/ProjectControlPanel';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { ProjectIntelligenceModal } from './components/modals/ProjectIntelligenceModal';
import { WelcomeView } from './components/views/WelcomeView';
import { AgentWorkspaceView } from './components/views/AgentWorkspaceView';
import { DesignSystemView } from './components/views/DesignSystemView';
import { SettingsView } from './components/views/SettingsView';
import { AIProviderHubView } from './components/views/AIProviderHubView';
import { CodeEvolutionView } from './components/views/CodeEvolutionView';
import { BugDetectiveView } from './components/views/BugDetectiveView';
import { ProductionWatchdogView } from './components/views/ProductionWatchdogView';
import { OperatorConsoleView } from './components/views/OperatorConsoleView';
import { VoiceCodingModal } from './components/modals/VoiceCodingModal';
import { CloneRepoModal } from './components/modals/CloneRepoModal';
import { CloseProjectModal } from './components/modals/CloseProjectModal';
import { OpenFolderModal } from './components/modals/OpenFolderModal';
import { CursorComposerModal } from './components/cursor/CursorComposerModal';
import { CursorRulesModal } from './components/cursor/CursorRulesModal';
import { WalkthroughTourModal } from './components/modals/WalkthroughTourModal';
import { useCommandInitializer } from './hooks/useCommandInitializer';

import { ThemeProvider, useTheme } from './context/ThemeContext';

function IDEWorkbench() {
  const {
    theme,
    activeView,
    setActiveView,
    isMultiFileReviewOpen,
    setIsMultiFileReviewOpen,
    proposedChanges,
    applySelectedChanges,
    isAcceptanceModalOpen,
    setIsAcceptanceModalOpen,
    isControlPanelOpen,
    isProjectWizardOpen,
    setIsProjectWizardOpen,
    isProjectIntelligenceOpen,
    setIsProjectIntelligenceOpen,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    isCloneModalOpen,
    setIsCloneModalOpen,
    isCloseModalOpen,
    setIsCloseModalOpen,
    isOpenFolderModalOpen,
    setIsOpenFolderModalOpen,
    confirmCloseProject,
    openLocalFolder,
    activeProject,
    openTabs,
    devServerProcess,
    orchestratorStatus,
    saveCurrentFile,
    saveAllFiles,
    runTests,
    debuggerEngine,
    debugSession,
    debugThread,
    setActiveSidebarTab,
  } = useIDE();

  const layout = useLayout();
  const themeEngine = useTheme();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCursorRulesOpen, setIsCursorRulesOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  // Auto-launch walkthrough tour for first-time users
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('vertex_forge_walkthrough_seen_v1');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsWalkthroughOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Global event listener to open walkthrough tour on demand
  useEffect(() => {
    const handleOpenTour = () => setIsWalkthroughOpen(true);
    window.addEventListener('vertex:open-walkthrough', handleOpenTour);
    return () => window.removeEventListener('vertex:open-walkthrough', handleOpenTour);
  }, []);

  // Initialize Global Command Registry
  useCommandInitializer({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onOpenNewProject: () => setIsProjectWizardOpen(true),
    onOpenComposer: () => setIsComposerOpen(true),
    onOpenCursorRules: () => setIsCursorRulesOpen(true),
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K or Cmd/Ctrl + P: Command Palette
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Cmd/Ctrl + B : Toggle Primary Sidebar
      else if (isCmdOrCtrl && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + I : Open Cursor Composer
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'i' && !e.shiftKey) {
        e.preventDefault();
        setIsComposerOpen(prev => !prev);
      }
      // Cmd/Ctrl + Alt + B or Cmd/Ctrl + J : Toggle AI Assistant
      else if ((isCmdOrCtrl && e.altKey && e.key.toLowerCase() === 'b') || (isCmdOrCtrl && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        layout.toggleSecondarySidebar();
      }
      // Cmd/Ctrl + ` : Toggle Terminal Dock
      else if (isCmdOrCtrl && e.key === '`') {
        e.preventDefault();
        layout.toggleBottomPanel();
      }
      // Cmd/Ctrl + Shift + M or Cmd/Ctrl + Alt + V : Toggle Voice Coding Assistant
      else if ((isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'm') || (isCmdOrCtrl && e.altKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        setIsVoiceModalOpen(prev => !prev);
      }
      // Cmd/Ctrl + Shift + V : Toggle Live Preview
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        layout.togglePreview();
      }
      // Cmd/Ctrl + Shift + Z : Toggle Zen Mode
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        layout.toggleZenMode();
      }
      // Cmd/Ctrl + \ : Split Editor Right
      else if (isCmdOrCtrl && e.key === '\\') {
        e.preventDefault();
        layout.splitEditor(layout.config.editorSplit === 'vertical' ? 'none' : 'vertical');
      }
      // Cmd/Ctrl + T : Run Vitest Suite
      else if (isCmdOrCtrl && e.key.toLowerCase() === 't') {
        e.preventDefault();
        runTests();
      }
      // Cmd/Ctrl + S : Save File
      else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
      // Cmd/Ctrl + Shift + E : Focus Explorer
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('explorer');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + F : Focus Search
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('search');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + G : Focus Source Control
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('git');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + X : Focus Extensions
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('extensions');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + , : Settings View
      else if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
      }
      // Cmd/Ctrl + / : Shortcuts cheat sheet
      else if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      // F5 : Start Debugging / Continue
      else if (e.key === 'F5' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (debugSession && debugThread?.status === 'paused') {
          debuggerEngine?.continue();
        } else {
          debuggerEngine?.startSession();
        }
      }
      // Shift + F5 : Stop Debugging
      else if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stopSession();
      }
      // F10 : Step Over
      else if (e.key === 'F10') {
        e.preventDefault();
        debuggerEngine?.stepOver();
      }
      // F11 : Step Into / Out
      else if (e.key === 'F11' && !e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stepInto();
      } else if (e.key === 'F11' && e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stepOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layout, runTests, saveCurrentFile]);

  const showPrimaryOnLeft =
    layout.config.primarySidebarPosition === 'left' &&
    layout.config.primarySidebarVisible;

  const showPrimaryOnRight =
    layout.config.primarySidebarPosition === 'right' &&
    layout.config.primarySidebarVisible;

  const showSecondaryOnLeft =
    layout.config.secondarySidebarPosition === 'left' &&
    layout.config.secondarySidebarVisible;

  const showSecondaryOnRight =
    layout.config.secondarySidebarPosition === 'right' &&
    layout.config.secondarySidebarVisible;

  return (
    <div
      style={{
        backgroundColor: 'var(--ide-bg)',
        color: 'var(--ide-text)',
      }}
      data-theme={themeEngine.themeId}
      className={`h-[100dvh] h-screen max-h-screen w-screen flex flex-col overflow-hidden font-sans select-none ${
        themeEngine.isDark ? 'dark' : 'light'
      }`}
    >
      {/* 1. TOP UNIFIED TITLEBAR (Sleek Desktop Omnibar & Controls) */}
      <TopMenuBar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNewProject={() => setIsProjectWizardOpen(true)}
        onOpenComposer={() => setIsComposerOpen(true)}
        onOpenCursorRules={() => setIsCursorRulesOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 3. MAIN WORKBENCH PANELS LAYOUT */}
      <div className="flex-1 flex w-full min-h-0 min-w-0 items-stretch overflow-hidden relative bg-[var(--ide-bg)] p-1 gap-1">
        {/* Slim Activity Bar (Explorer, Search, Git, Tests, Agents, Tokens, Settings) */}
        {layout.config.activityBarVisible && <ActivityBar />}

        {/* Primary Sidebar (Left placement) */}
        {showPrimaryOnLeft && (
          <>
            <Sidebar />
            <Splitter
              direction="vertical"
              onResize={delta => layout.setPrimarySidebarWidth(layout.config.primarySidebarWidth + delta)}
              label="Resize primary sidebar"
            />
          </>
        )}

        {/* Secondary AI Panel (Left placement if moved) */}
        {showSecondaryOnLeft && (
          <>
            <AIOrchestratorPanel />
            <Splitter
              direction="vertical"
              onResize={delta => layout.setSecondarySidebarWidth(layout.config.secondarySidebarWidth + delta)}
              label="Resize AI assistant panel"
            />
          </>
        )}

        {/* Central Workspace / Active View */}
        <div
          style={{
            backgroundColor: 'var(--ide-editor-bg)',
            borderColor: 'var(--ide-border)',
          }}
          className="flex-1 flex flex-col min-w-0 md:min-w-[320px] lg:min-w-[360px] h-full self-stretch min-h-0 overflow-hidden relative border rounded-xl shadow-sm"
        >
          {activeView === 'welcome' && (
            <WelcomeView
              onOpenNewProject={() => setIsProjectWizardOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onOpenTour={() => setIsWalkthroughOpen(true)}
            />
          )}

          {activeView === 'agents' && <AgentWorkspaceView />}

          {activeView === 'design-system' && <DesignSystemView />}

          {activeView === 'settings' && <SettingsView />}

          {activeView === 'providers' && <AIProviderHubView onClose={() => setActiveView('editor')} />}

          {activeView === 'evolution' && <CodeEvolutionView />}

          {activeView === 'bug-detective' && <BugDetectiveView />}

          {activeView === 'watchdog' && <ProductionWatchdogView />}
          {activeView === 'operator' && <OperatorConsoleView onClose={() => setActiveView('editor')} />}

          {(!activeView || activeView === 'editor') && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Multi-Tab Code Editor Area with Split Groups */}
              {!layout.config.bottomPanelMaximized && <EditorArea />}

              {/* Bottom Resizable Panel Dock (Terminal, Problems, Tests, Audit) */}
              {layout.config.bottomPanelVisible && (
                <>
                  {!layout.config.bottomPanelMaximized && (
                    <Splitter
                      direction="horizontal"
                      onResize={delta => layout.setBottomPanelHeight(layout.config.bottomPanelHeight - delta)}
                      label="Resize bottom terminal dock"
                    />
                  )}
                  <BottomPanel />
                </>
              )}
            </div>
          )}
        </div>

        {/* Dedicated Project Control Panel (Docked when toggled) */}
        {isControlPanelOpen && (
          <div
            style={{
              backgroundColor: 'var(--ide-surface)',
              borderColor: 'var(--ide-border)',
            }}
            className="w-72 lg:w-80 max-w-[30vw] h-full self-stretch min-h-0 border rounded-xl overflow-hidden shadow-xs shrink-0"
          >
            <ProjectControlPanel />
          </div>
        )}

        {/* Secondary AI Assistant Panel (Right placement - default) */}
        {showSecondaryOnRight && (
          <>
            <Splitter
              direction="vertical"
              onResize={delta => layout.setSecondarySidebarWidth(layout.config.secondarySidebarWidth - delta)}
              label="Resize AI assistant panel"
            />
            <AIOrchestratorPanel />
          </>
        )}

        {/* Primary Sidebar (Right placement if moved) */}
        {showPrimaryOnRight && (
          <>
            <Splitter
              direction="vertical"
              onResize={delta => layout.setPrimarySidebarWidth(layout.config.primarySidebarWidth - delta)}
              label="Resize primary sidebar"
            />
            <Sidebar />
          </>
        )}

        {/* Live Browser / Mobile Sandbox Preview */}
        {layout.config.previewVisible && (
          <>
            <Splitter
              direction="vertical"
              onResize={delta => layout.setPreviewWidth(layout.config.previewWidth - delta)}
              label="Resize live preview panel"
            />
            <PreviewPanel />
          </>
        )}
      </div>

      {/* 4. BOTTOM PROFESSIONAL DESKTOP STATUS BAR */}
      <StatusBar />

      {/* 5. MODALS & DIALOGS */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewProject={() => setIsProjectWizardOpen(true)}
      />

      <ProjectCreationWizard
        isOpen={isProjectWizardOpen}
        onClose={() => setIsProjectWizardOpen(false)}
      />

      <MultiFileReviewModal
        isOpen={isMultiFileReviewOpen}
        onClose={() => setIsMultiFileReviewOpen(false)}
        changes={proposedChanges}
        onApplySelected={applySelectedChanges}
      />

      <AcceptanceTestRunnerModal
        isOpen={isAcceptanceModalOpen}
        onClose={() => setIsAcceptanceModalOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ProjectIntelligenceModal
        isOpen={isProjectIntelligenceOpen}
        onClose={() => setIsProjectIntelligenceOpen(false)}
      />

      <VoiceCodingModal />

      <CloneRepoModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onProjectCloned={async (clonedPath) => {
          await openLocalFolder(clonedPath);
          setIsCloneModalOpen(false);
        }}
      />

      <CloseProjectModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        projectName={activeProject.name}
        dirtyTabs={openTabs.filter(t => t.isDirty)}
        hasRunningServer={!!devServerProcess}
        hasRunningAgent={orchestratorStatus === 'executing' || orchestratorStatus === 'planning'}
        onSaveAndClose={async () => {
          await saveAllFiles();
          confirmCloseProject(true);
        }}
        onDiscardAndClose={() => {
          confirmCloseProject(false);
        }}
      />

      {/* In-App Zero-Native-Dialog Open Folder Modal */}
      <OpenFolderModal
        isOpen={isOpenFolderModalOpen}
        onClose={() => setIsOpenFolderModalOpen(false)}
        onSelectFolder={async (selectedPath) => {
          await openLocalFolder(selectedPath);
          setIsOpenFolderModalOpen(false);
        }}
      />

      {/* Cursor Composer Modal (Cmd+I) */}
      <CursorComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />

      {/* Cursor Rules Modal */}
      <CursorRulesModal
        isOpen={isCursorRulesOpen}
        onClose={() => setIsCursorRulesOpen(false)}
      />

      {/* First-Time User Walkthrough & Feature Tour Modal */}
      <WalkthroughTourModal
        isOpen={isWalkthroughOpen}
        onClose={() => {
          setIsWalkthroughOpen(false);
          localStorage.setItem('vertex_forge_walkthrough_seen_v1', 'true');
        }}
        onOpenProjectWizard={() => {
          setIsWalkthroughOpen(false);
          localStorage.setItem('vertex_forge_walkthrough_seen_v1', 'true');
          setIsProjectWizardOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <IDEProvider>
        <LayoutProvider>
          <IDEWorkbench />
        </LayoutProvider>
      </IDEProvider>
    </ThemeProvider>
  );
}
