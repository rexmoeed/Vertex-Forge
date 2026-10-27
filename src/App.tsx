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
import { ProjectControlPanel } from './components/workspace/ProjectControlPanel';
import { WelcomeView } from './components/views/WelcomeView';
import { AgentWorkspaceView } from './components/views/AgentWorkspaceView';
import { DesignSystemView } from './components/views/DesignSystemView';
import { SettingsView } from './components/views/SettingsView';
import { AIProviderHubView } from './components/views/AIProviderHubView';
import { CodeEvolutionView } from './components/views/CodeEvolutionView';
import { BugDetectiveView } from './components/views/BugDetectiveView';
import { ProductionWatchdogView } from './components/views/ProductionWatchdogView';
import { OperatorConsoleView } from './components/views/OperatorConsoleView';
import { WorkbenchModals } from './components/layout/WorkbenchModals';
import { useCommandInitializer } from './hooks/useCommandInitializer';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

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
  const [isJulesMissionOpen, setIsJulesMissionOpen] = useState(false);

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
  useGlobalShortcuts({
    layout,
    setIsCommandPaletteOpen,
    setIsComposerOpen,
    setIsVoiceModalOpen,
    setIsShortcutsOpen,
    runTests,
    saveCurrentFile,
    setActiveView,
    setActiveSidebarTab,
    debugSession,
    debugThread,
    debuggerEngine,
  });

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
        onOpenJulesMission={() => setIsJulesMissionOpen(true)}
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
      <WorkbenchModals
        isCommandPaletteOpen={isCommandPaletteOpen}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        isProjectWizardOpen={isProjectWizardOpen}
        setIsProjectWizardOpen={setIsProjectWizardOpen}
        isMultiFileReviewOpen={isMultiFileReviewOpen}
        setIsMultiFileReviewOpen={setIsMultiFileReviewOpen}
        proposedChanges={proposedChanges}
        applySelectedChanges={applySelectedChanges}
        isAcceptanceModalOpen={isAcceptanceModalOpen}
        setIsAcceptanceModalOpen={setIsAcceptanceModalOpen}
        isShortcutsOpen={isShortcutsOpen}
        setIsShortcutsOpen={setIsShortcutsOpen}
        isProjectIntelligenceOpen={isProjectIntelligenceOpen}
        setIsProjectIntelligenceOpen={setIsProjectIntelligenceOpen}
        isJulesMissionOpen={isJulesMissionOpen}
        setIsJulesMissionOpen={setIsJulesMissionOpen}
        isCloneModalOpen={isCloneModalOpen}
        setIsCloneModalOpen={setIsCloneModalOpen}
        isCloseModalOpen={isCloseModalOpen}
        setIsCloseModalOpen={setIsCloseModalOpen}
        isOpenFolderModalOpen={isOpenFolderModalOpen}
        setIsOpenFolderModalOpen={setIsOpenFolderModalOpen}
        isComposerOpen={isComposerOpen}
        setIsComposerOpen={setIsComposerOpen}
        isCursorRulesOpen={isCursorRulesOpen}
        setIsCursorRulesOpen={setIsCursorRulesOpen}
        isWalkthroughOpen={isWalkthroughOpen}
        setIsWalkthroughOpen={setIsWalkthroughOpen}
        openLocalFolder={openLocalFolder}
        activeProject={activeProject}
        openTabs={openTabs}
        devServerProcess={devServerProcess}
        orchestratorStatus={orchestratorStatus}
        saveAllFiles={saveAllFiles}
        confirmCloseProject={confirmCloseProject}
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
