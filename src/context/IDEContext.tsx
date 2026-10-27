import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { VirtualFileSystem } from '../services/virtualFs';
import { TerminalRunner } from '../services/terminalRunner';
import { DesktopBridge } from '../services/desktopBridge';
import { editorFileService } from '../services/editorFileService';
import { voiceCodingEngine } from '../services/voiceCodingEngine';
import { codeEvolutionService } from '../services/codeEvolutionService';
import { bugDetective } from '../services/bugDetectiveService';
import { productionWatchdogService } from '../services/productionWatchdogService';
import { useTheme } from './ThemeContext';
import { UIProvider, useUI, CursorMode, IDEActiveView } from './UIContext';
import { GitProvider, useGit } from './GitContext';
import { AgentProvider, useAgent } from './AgentContext';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { TerminalProvider, useTerminal } from './TerminalContext';
import { WorkspaceLifecycleService } from '../services/workspaceLifecycleService';
import { useIDEDebugger } from './hooks/useIDEDebugger';
import { useIDEAutonomousEngine } from './hooks/useIDEAutonomousEngine';
import { useIDEEditorFiles } from './hooks/useIDEEditorFiles';
import { IDEContextType } from './types/ideContext.types';

export type { CursorMode, IDEActiveView };
export type { IDEContextType } from './types/ideContext.types';

const IDEContext = createContext<IDEContextType | undefined>(undefined);

const IDEInternalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ui = useUI();
  const git = useGit();
  const agent = useAgent();
  const terminal = useTerminal();
  const workspace = useWorkspace();
  const themeEngine = useTheme();

  const [vfs, setVfs] = useState<VirtualFileSystem>(() => new VirtualFileSystem([]));

  const { setRunner } = terminal;
  useEffect(() => {
    if (!workspace.activeProject.rootFiles || workspace.activeProject.rootFiles.length === 0) return;
    const newVfs = new VirtualFileSystem(workspace.activeProject.rootFiles);
    setVfs(newVfs);
    setRunner(new TerminalRunner(newVfs));
  }, [workspace.activeProject.id, workspace.activeProject.rootFiles, setRunner]);

  const {
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    activeFile,
    setActiveFile,
    activeFileContent,
    setActiveFileContent,
    autoSave,
    setAutoSave,
    autoSaveDelay,
    setAutoSaveDelay,
    isAutoSaving,
    isCreatingFile,
    setIsCreatingFile,
    isCreatingFolder,
    setIsCreatingFolder,
    startCreatingFile,
    startCreatingFolder,
    openFileInEditor,
    openFile,
    closeTab,
    updateFileContent,
    saveCurrentFile,
    saveAllFiles,
    createFileOrFolder,
    renameFileOrFolder,
    deleteFileOrFolder,
  } = useIDEEditorFiles({
    vfs,
    activeProjectId: workspace.activeProject.id,
    setCursorPosition: ui.setCursorPosition,
    setActiveView: ui.setActiveView,
    logAgentAction: agent.logAgentAction,
    refreshGit: async () => {
      await git.refreshGit();
    },
  });

  const autoEngine = useIDEAutonomousEngine({
    vfs,
    projectProfile: workspace.projectProfile,
    agent,
    ui,
    git,
    activeFile,
    activeFileContent,
    setActiveFileContent,
    openTabs,
    testResults: terminal.testResults,
    problems: terminal.problems,
    runTests: terminal.runTests,
  });

  const dbg = useIDEDebugger({
    vfs,
    ui,
    openFile,
    agent,
    updateFileContent,
  });

  const openLocalFolder = useCallback(
    async (customPath?: string): Promise<boolean> => {
      let folderPath = customPath;
      if (!folderPath) {
        if (DesktopBridge.isElectron) {
          folderPath = (await DesktopBridge.openDirectoryDialog()) || undefined;
          if (!folderPath) return false;
        } else {
          ui.setIsOpenFolderModalOpen(true);
          return false;
        }
      }

      try {
        const res = await WorkspaceLifecycleService.openLocalFolder(folderPath, agent.logAgentAction);
        workspace.setActiveProject(res.project);
        workspace.setProjectProfile(res.profile);
        workspace.setProjects(prev => [res.project, ...prev.filter(p => p.id !== res.project.id)]);
        setVfs(res.services.vfs);
        terminal.setRunner(res.services.runner);
        autoEngine.setIndexer(res.services.indexer);
        autoEngine.setNavigator(res.services.navigator);
        setOpenTabs(res.openTabs);
        setActiveTabId(res.openTabs[0]?.id || null);
        setActiveFile(res.activeFile);
        setActiveFileContent(res.initialContent);
        ui.setActiveView('editor');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        agent.logAgentAction('Architect', `Failed to open project: ${msg}`, 'error');
        return false;
      }
    },
    [ui, agent, workspace, terminal, autoEngine, setOpenTabs, setActiveTabId, setActiveFile, setActiveFileContent]
  );

  const openLocalFile = useCallback(
    async (customPath?: string): Promise<boolean> => {
      let filePath = customPath;
      if (!filePath) {
        filePath = (await DesktopBridge.openFileDialog()) || undefined;
      }
      if (!filePath) return false;
      try {
        await openFile(filePath);
        ui.setActiveView('editor');
        return true;
      } catch {
        return false;
      }
    },
    [openFile, ui]
  );

  const closeProject = useCallback(() => {
    ui.setIsCloseModalOpen(true);
  }, [ui]);

  const confirmCloseProject = useCallback(
    (saveAll: boolean) => {
      if (saveAll) saveAllFiles();
      setOpenTabs([]);
      setActiveTabId(null);
      setActiveFile(null);
      setActiveFileContent('');
      ui.setIsCloseModalOpen(false);
    },
    [saveAllFiles, ui, setOpenTabs, setActiveTabId, setActiveFile, setActiveFileContent]
  );

  const cloneRepository = useCallback(
    async (repoUrl: string, _targetDir?: string): Promise<boolean> => {
      try {
        agent.logAgentAction('Architect', `Cloning ${repoUrl}...`, 'info');
        await new Promise(r => setTimeout(r, 600));
        agent.logAgentAction('Architect', `Cloned ${repoUrl} successfully.`, 'success');
        git.setIsCloneModalOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [agent, git]
  );

  const commitChanges = useCallback(
    (msg: string) => {
      vfs.commit(msg);
      git.commitChanges(msg);
    },
    [vfs, git]
  );

  const revertFile = useCallback(
    (path: string) => {
      git.revertFile(path);
    },
    [git]
  );

  const toggleTheme = useCallback(() => {
    const cycleThemeIds = [
      'antigravity',
      'nordic-frost',
      'synthwave-84',
      'dracula',
      'github-dark',
      'tokyo-night',
      'solarized-dark',
      'monokai-pro',
      'cyberpunk',
      'gruvbox-dark',
      'rose-pine',
    ];
    const currentIndex = cycleThemeIds.indexOf(themeEngine.activeTheme.id);
    const nextThemeId = cycleThemeIds[(currentIndex + 1) % cycleThemeIds.length];
    themeEngine.setTheme(nextThemeId);
  }, [themeEngine]);

  const modifiedFiles = useMemo(() => vfs.getModifiedFiles(), [vfs, activeFileContent]);
  const commits = useMemo(() => vfs.getCommits(), [vfs]);
  const fileTree = useMemo(() => vfs.getTree(), [vfs]);

  const executeStep = useCallback(async () => {}, []);
  const approveTask = useCallback((_taskId: string) => {}, []);
  const rejectTask = useCallback((_taskId: string) => {}, []);
  const cancelOrchestration = useCallback(() => {
    agent.setOrchestratorStatus('idle');
  }, [agent]);

  const value = useMemo<IDEContextType>(
    () => ({
      projects: workspace.projects,
      activeProject: workspace.activeProject,
      vfs,
      switchProject: pId => workspace.switchProject(pId, agent.logAgentAction),
      createNewProject: async (name, desc, arch) => {
        await workspace.createNewProject(name, desc, arch, agent.logAgentAction);
      },
      fileTree,
      activeFile,
      activeFileContent,
      openTabs,
      activeTabId,
      openFile,
      openFileInEditor,
      editorFileService,
      closeTab,
      updateFileContent,
      saveCurrentFile,
      saveAllFiles,
      autoSave,
      setAutoSave,
      autoSaveDelay,
      setAutoSaveDelay,
      isAutoSaving,
      createFileOrFolder,
      deleteFileOrFolder,
      renameFileOrFolder,
      isCreatingFile,
      setIsCreatingFile,
      isCreatingFolder,
      setIsCreatingFolder,
      startCreatingFile,
      startCreatingFolder,

      projectProfile: workspace.projectProfile,
      updateProjectProfileOverrides: workspace.updateProjectProfileOverrides,
      refreshProjectHealth: workspace.refreshProjectHealth,
      openLocalFolder,
      openLocalFile,
      closeProject,
      confirmCloseProject,
      isCloseModalOpen: ui.isCloseModalOpen,
      setIsCloseModalOpen: ui.setIsCloseModalOpen,
      cloneRepository,
      isCloneModalOpen: git.isCloneModalOpen,
      setIsCloneModalOpen: git.setIsCloneModalOpen,
      isOpenFolderModalOpen: ui.isOpenFolderModalOpen,
      setIsOpenFolderModalOpen: ui.setIsOpenFolderModalOpen,
      devServerProcess: workspace.devServerProcess,
      startDevServer: workspace.startDevServer,
      stopDevServer: workspace.stopDevServer,
      restartDevServer: workspace.restartDevServer,
      gitProfile: git.gitProfile,
      refreshGit: async () => {
        await git.refreshGit();
      },
      gitStageFile: git.stageFile,

      terminalHistory: terminal.terminalHistory,
      runCommand: terminal.runCommand,
      clearTerminal: terminal.clearTerminal,
      testResults: terminal.testResults,
      problems: terminal.problems,
      runTests: () => terminal.runTests(activeFile, agent.logAgentAction),
      runBuild: () => terminal.runBuild(workspace.projectProfile, activeFile, agent.logAgentAction),
      runLint: () => terminal.runLint(agent.logAgentAction),

      modifiedFiles,
      commits,
      commitChanges,
      revertFile,
      aiCodeReview: null,
      isReviewingCode: false,
      reviewCurrentCode: async () => {},

      autonomyMode: agent.autonomyMode,
      setAutonomyMode: agent.setAutonomyMode,
      activeAgent: agent.activeAgent,
      setActiveAgent: agent.setActiveAgent,
      orchestratorStatus: agent.orchestratorStatus,
      taskPlan: agent.taskPlan,
      currentTaskIndex: agent.currentTaskIndex,
      agentLogs: agent.agentLogs,
      logAgentAction: agent.logAgentAction,
      startAutonomousPlan: autoEngine.startAutonomousPlan,
      executeStep,
      approveTask,
      rejectTask,
      cancelOrchestration,
      triggerSelfHealDebug: autoEngine.triggerSelfHealDebug,
      runSecurityReview: autoEngine.runSecurityReview,
      codeReviewResult: autoEngine.codeReviewResult,

      activeView: ui.activeView,
      setActiveView: ui.setActiveView,
      theme: themeEngine.isDark ? 'dark' : 'light',
      toggleTheme,
      activeThemeName: themeEngine.activeTheme.name,
      activeSidebarTab: ui.activeSidebarTab,
      setActiveSidebarTab: ui.setActiveSidebarTab,
      bottomPanelTab: ui.bottomPanelTab,
      setBottomPanelTab: ui.setBottomPanelTab,
      isBottomPanelOpen: ui.isBottomPanelOpen,
      toggleBottomPanel: ui.toggleBottomPanel,
      showPreview: ui.showPreview,
      setShowPreview: ui.setShowPreview,
      previewDevice: ui.previewDevice,
      setPreviewDevice: ui.setPreviewDevice,

      hasApiKey: autoEngine.hasApiKey,
      cursorPosition: ui.cursorPosition,
      setCursorPosition: ui.setCursorPosition,

      cursorMode: ui.cursorMode,
      setCursorMode: ui.setCursorMode,
      indexer: autoEngine.indexer,
      navigator: autoEngine.navigator,
      proposedChanges: autoEngine.proposedChanges,
      isMultiFileReviewOpen: ui.isMultiFileReviewOpen,
      setIsMultiFileReviewOpen: ui.setIsMultiFileReviewOpen,
      proposeMultiFileChanges: autoEngine.proposeMultiFileChanges,
      applySelectedChanges: autoEngine.applySelectedChanges,
      isAcceptanceModalOpen: ui.isAcceptanceModalOpen,
      setIsAcceptanceModalOpen: ui.setIsAcceptanceModalOpen,
      isControlPanelOpen: ui.isControlPanelOpen,
      setIsControlPanelOpen: ui.setIsControlPanelOpen,
      isProjectWizardOpen: ui.isProjectWizardOpen,
      setIsProjectWizardOpen: ui.setIsProjectWizardOpen,
      isProjectIntelligenceOpen: ui.isProjectIntelligenceOpen,
      setIsProjectIntelligenceOpen: ui.setIsProjectIntelligenceOpen,
      lastInspectionResult: autoEngine.lastInspectionResult,
      inspectFeature: autoEngine.inspectFeature,

      isVoiceModalOpen: ui.isVoiceModalOpen,
      setIsVoiceModalOpen: ui.setIsVoiceModalOpen,
      voiceCodingEngine,
      codeEvolutionService,
      bugDetective,
      productionWatchdogService,

      autonomousEngine: autoEngine.autonomousEngine,
      autonomousPlan: agent.autonomousPlan,
      autonomousExecutionState: agent.autonomousExecutionState,
      verificationSummary: agent.verificationSummary,
      pauseAutonomousPlan: autoEngine.pauseAutonomousPlan,
      resumeAutonomousPlan: autoEngine.resumeAutonomousPlan,
      cancelAutonomousPlan: autoEngine.cancelAutonomousPlan,
      approveAutonomousPlan: autoEngine.approveAutonomousPlan,
      rejectAutonomousPlan: autoEngine.rejectAutonomousPlan,
      rollbackAutonomousPlan: autoEngine.rollbackAutonomousPlan,
      retryAutonomousTask: autoEngine.retryAutonomousTask,

      debuggerEngine: dbg.debuggerEngine,
      debugSession: dbg.debugSession,
      debugThread: dbg.debugThread,
      debugBreakpoints: dbg.debugBreakpoints,
      debugStackFrames: dbg.debugStackFrames,
      debugVariables: dbg.debugVariables,
      debugWatchExpressions: dbg.debugWatchExpressions,
      debugConsoleMessages: dbg.debugConsoleMessages,
      debugLocation: dbg.debugLocation,
      aiDebugDiagnosis: dbg.aiDebugDiagnosis,
      diagnoseCrashWithAI: dbg.diagnoseCrashWithAI,
      applyAIDebugFix: dbg.applyAIDebugFix,
      toggleBreakpoint: dbg.toggleBreakpoint,
    }),
    [
      workspace,
      vfs,
      openTabs,
      activeTabId,
      activeFile,
      activeFileContent,
      openFile,
      openFileInEditor,
      closeTab,
      updateFileContent,
      saveCurrentFile,
      saveAllFiles,
      autoSave,
      autoSaveDelay,
      isAutoSaving,
      createFileOrFolder,
      deleteFileOrFolder,
      renameFileOrFolder,
      isCreatingFile,
      isCreatingFolder,
      startCreatingFile,
      startCreatingFolder,
      openLocalFolder,
      openLocalFile,
      closeProject,
      confirmCloseProject,
      ui,
      cloneRepository,
      git,
      terminal,
      modifiedFiles,
      commits,
      commitChanges,
      revertFile,
      agent,
      autoEngine,
      dbg,
      themeEngine,
      toggleTheme,
      executeStep,
      approveTask,
      rejectTask,
      cancelOrchestration,
      fileTree,
    ]
  );

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
};

export const IDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <WorkspaceProvider>
        <AgentProvider>
          <GitProvider>
            <TerminalProvider>
              <IDEInternalProvider>{children}</IDEInternalProvider>
            </TerminalProvider>
          </GitProvider>
        </AgentProvider>
      </WorkspaceProvider>
    </UIProvider>
  );
};

export const useIDE = (): IDEContextType => {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useIDE must be used within an IDEProvider');
  }
  return context;
};
