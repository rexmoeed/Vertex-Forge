import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Project } from '../types/ide';
import { ProjectProfile, DevServerProcess } from '../types/project';
import { WorkspaceLifecycleService } from '../services/workspaceLifecycleService';
import { logger } from '../services/logger';

export interface WorkspaceContextType {
  projects: Project[];
  activeProject: Project;
  projectProfile: ProjectProfile | null;
  devServerProcess: DevServerProcess | null;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setActiveProject: React.Dispatch<React.SetStateAction<Project>>;
  setProjectProfile: React.Dispatch<React.SetStateAction<ProjectProfile | null>>;
  setDevServerProcess: React.Dispatch<React.SetStateAction<DevServerProcess | null>>;
  switchProject: (projectId: string, onLog?: (agent: any, msg: string, status: any) => void) => void;
  createNewProject: (name: string, description: string, archetype?: any, onLog?: (agent: any, msg: string, status: any) => void) => Promise<Project>;
  updateProjectProfileOverrides: (overrides: ProjectProfile['userOverrides']) => void;
  refreshProjectHealth: () => void;
  startDevServer: (command?: string) => Promise<void>;
  stopDevServer: () => Promise<void>;
  restartDevServer: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const INITIAL_PROJECT: Project = {
  id: 'proj-default-1',
  name: 'Vertex Forge',
  description: 'Enterprise AI Native Autonomous IDE',
  techStack: {
    frontend: 'React + TypeScript',
    backend: 'Node/Express',
    styling: 'TailwindCSS',
    packageManager: 'npm',
    runtime: 'node',
  },
  rootFiles: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const WorkspaceProvider: React.FC<{ children: ReactNode; initialProjects?: Project[] }> = ({
  children,
  initialProjects,
}) => {
  const [projects, setProjects] = useState<Project[]>(() => initialProjects || [INITIAL_PROJECT]);
  const [activeProject, setActiveProject] = useState<Project>(() => initialProjects?.[0] || INITIAL_PROJECT);
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
  const [devServerProcess, setDevServerProcess] = useState<DevServerProcess | null>(null);

  const switchProject = useCallback((projectId: string, onLog?: (agent: any, msg: string, status: any) => void) => {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setActiveProject(proj);
      onLog?.('Architect', `Switched workspace to project: ${proj.name}`, 'info');
    }
  }, [projects]);

  const createNewProject = useCallback(async (
    name: string,
    description: string,
    archetype: any = 'fullstack-saas',
    onLog?: (agent: any, msg: string, status: any) => void
  ): Promise<Project> => {
    const newProj = WorkspaceLifecycleService.createNewProject(name, description, archetype);
    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
    onLog?.('Architect', `Project "${name}" initialized successfully.`, 'success');
    return newProj;
  }, []);

  const updateProjectProfileOverrides = useCallback((overrides: ProjectProfile['userOverrides']) => {
    setProjectProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        userOverrides: { ...prev.userOverrides, ...overrides },
      };
    });
  }, []);

  const refreshProjectHealth = useCallback(() => {
    if (!projectProfile) return;
    setProjectProfile(prev => (prev ? { ...prev, lastAnalyzed: Date.now() } : null));
  }, [projectProfile]);

  const startDevServer = useCallback(async (command?: string) => {
    setDevServerProcess({
      status: 'starting',
      port: 5173,
      url: 'http://localhost:5173',
      command: command || 'npm run dev',
      cwd: '/',
      pid: Math.floor(Math.random() * 90000) + 10000,
      startTime: Date.now(),
      logs: ['[Vite] Server starting on http://localhost:5173...'],
    });

    setTimeout(() => {
      setDevServerProcess(prev =>
        prev
          ? {
              ...prev,
              status: 'running',
              logs: [...prev.logs, '[Vite] ready in 250ms.', '[Vite] Local: http://localhost:5173/'],
            }
          : null
      );
    }, 600);
  }, []);

  const stopDevServer = useCallback(async () => {
    if (!devServerProcess) return;
    setDevServerProcess(prev =>
      prev
        ? {
            ...prev,
            status: 'stopped',
            logs: [...prev.logs, '[Vite] Dev server stopped.'],
          }
        : null
    );
  }, [devServerProcess]);

  const restartDevServer = useCallback(async () => {
    await stopDevServer();
    await startDevServer();
  }, [stopDevServer, startDevServer]);

  const value = useMemo<WorkspaceContextType>(() => ({
    projects,
    activeProject,
    projectProfile,
    devServerProcess,
    setProjects,
    setActiveProject,
    setProjectProfile,
    setDevServerProcess,
    switchProject,
    createNewProject,
    updateProjectProfileOverrides,
    refreshProjectHealth,
    startDevServer,
    stopDevServer,
    restartDevServer,
  }), [projects, activeProject, projectProfile, devServerProcess, switchProject, createNewProject, updateProjectProfileOverrides, refreshProjectHealth, startDevServer, stopDevServer, restartDevServer]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
