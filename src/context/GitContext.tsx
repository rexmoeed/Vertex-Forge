import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { GitProfile } from '../types/project';
import { DesktopBridge } from '../services/desktopBridge';
import { logger } from '../services/logger';

export interface GitContextType {
  gitProfile: GitProfile | null;
  isCloneModalOpen: boolean;
  setIsCloneModalOpen: (open: boolean) => void;
  isRefreshingGit: boolean;
  refreshGit: () => Promise<GitProfile | null>;
  stageFile: (filePath: string) => Promise<void>;
  commitChanges: (msg: string) => Promise<{ success: boolean; hash?: string }>;
  revertFile: (path: string) => Promise<void>;
  cloneRepository: (repoUrl: string, targetDir?: string) => Promise<{ success: boolean; targetPath?: string; error?: string }>;
}

const GitContext = createContext<GitContextType | null>(null);

export interface GitProviderProps {
  children: React.ReactNode;
  initialProfile?: GitProfile | null;
  onLogAction?: (action: string, status: 'info' | 'success' | 'warning' | 'error') => void;
}

export const GitProvider: React.FC<GitProviderProps> = ({
  children,
  initialProfile = null,
  onLogAction,
}) => {
  const [gitProfile, setGitProfile] = useState<GitProfile | null>(initialProfile);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [isRefreshingGit, setIsRefreshingGit] = useState<boolean>(false);

  const refreshGit = useCallback(async (): Promise<GitProfile | null> => {
    setIsRefreshingGit(true);
    try {
      const git = await DesktopBridge.getGitStatus(DesktopBridge.currentWorkspacePath);
      const profile: GitProfile = {
        isRepo: !!git.isRepo,
        branch: git.branch || 'main',
        ahead: git.ahead || 0,
        behind: git.behind || 0,
        modifiedCount: git.modifiedCount ?? git.modified?.length ?? 0,
        stagedCount: git.stagedCount ?? git.staged?.length ?? 0,
        untrackedCount: git.untrackedCount ?? git.untracked?.length ?? 0,
        lastCommit: git.lastCommit,
      };
      setGitProfile(profile);
      logger.info('Refreshed git repository status', { branch: profile.branch, isRepo: profile.isRepo });
      return profile;
    } catch (err) {
      logger.error('Failed to refresh git status', { cause: err });
      return null;
    } finally {
      setIsRefreshingGit(false);
    }
  }, []);

  const stageFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      await DesktopBridge.executeCommand(`git add "${filePath}"`);
      await refreshGit();
      onLogAction?.(`Staged file: ${filePath}`, 'info');
      logger.info('Staged file in git index', { filePath });
    } catch (err) {
      logger.error('Failed to stage file', { filePath, cause: err });
      onLogAction?.(`Failed to stage ${filePath}`, 'error');
    }
  }, [refreshGit, onLogAction]);

  const commitChanges = useCallback(async (msg: string): Promise<{ success: boolean; hash?: string }> => {
    try {
      const res = await DesktopBridge.executeCommand(`git commit -m "${msg}"`);
      await refreshGit();
      onLogAction?.(`Committed git changes: "${msg}"`, 'success');
      logger.info('Committed git changes', { message: msg });
      return { success: res.exitCode === 0, hash: res.stdout?.slice(0, 7) };
    } catch (err) {
      logger.error('Git commit failed', { message: msg, cause: err });
      onLogAction?.(`Git commit failed: "${msg}"`, 'error');
      return { success: false };
    }
  }, [refreshGit, onLogAction]);

  const revertFile = useCallback(async (path: string): Promise<void> => {
    try {
      await DesktopBridge.executeCommand(`git checkout -- "${path}"`);
      await refreshGit();
      onLogAction?.(`Reverted file: ${path}`, 'warning');
      logger.info('Reverted file via git', { path });
    } catch (err) {
      logger.error('Failed to revert file', { path, cause: err });
      onLogAction?.(`Failed to revert ${path}`, 'error');
    }
  }, [refreshGit, onLogAction]);

  const cloneRepository = useCallback(async (repoUrl: string, targetDir?: string): Promise<{ success: boolean; targetPath?: string; error?: string }> => {
    onLogAction?.(`Cloning Git repository: ${repoUrl}`, 'info');
    logger.info('Initiating git clone', { repoUrl, targetDir });
    try {
      const res = await DesktopBridge.gitClone(repoUrl, targetDir);
      if (res.success && res.targetPath) {
        onLogAction?.(`Cloned repository into ${res.targetPath}`, 'success');
        logger.info('Git clone completed successfully', { targetPath: res.targetPath });
        return { success: true, targetPath: res.targetPath };
      } else {
        const errorMsg = res.error || 'Unknown clone error';
        onLogAction?.(`Git clone failed: ${errorMsg}`, 'error');
        logger.error('Git clone operation returned failure', { error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onLogAction?.(`Git clone error: ${msg}`, 'error');
      logger.error('Git clone exception thrown', { cause: err });
      return { success: false, error: msg };
    }
  }, [onLogAction]);

  const value = useMemo<GitContextType>(() => ({
    gitProfile,
    isCloneModalOpen,
    setIsCloneModalOpen,
    isRefreshingGit,
    refreshGit,
    stageFile,
    commitChanges,
    revertFile,
    cloneRepository,
  }), [
    gitProfile,
    isCloneModalOpen,
    isRefreshingGit,
    refreshGit,
    stageFile,
    commitChanges,
    revertFile,
    cloneRepository,
  ]);

  return <GitContext.Provider value={value}>{children}</GitContext.Provider>;
};

export const useGit = (): GitContextType => {
  const context = useContext(GitContext);
  if (!context) {
    throw new Error('useGit must be used within a GitProvider');
  }
  return context;
};
