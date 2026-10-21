import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  AutonomyMode,
  AgentRole,
  OrchestratorStatus,
  TaskItem,
  AgentLog,
} from '../types/ide';
import {
  AutonomousPlan,
  AutonomousExecutionState,
  VerificationSummary,
} from '../types/autonomousAgent';
import { logger } from '../services/logger';

export interface AgentContextType {
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  activeAgent: AgentRole;
  setActiveAgent: (role: AgentRole) => void;
  orchestratorStatus: OrchestratorStatus;
  setOrchestratorStatus: (status: OrchestratorStatus) => void;
  taskPlan: TaskItem[];
  setTaskPlan: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  currentTaskIndex: number;
  setCurrentTaskIndex: React.Dispatch<React.SetStateAction<number>>;
  autonomousPlan: AutonomousPlan | null;
  setAutonomousPlan: React.Dispatch<React.SetStateAction<AutonomousPlan | null>>;
  autonomousExecutionState: AutonomousExecutionState;
  setAutonomousExecutionState: React.Dispatch<React.SetStateAction<AutonomousExecutionState>>;
  verificationSummary: VerificationSummary | null;
  setVerificationSummary: React.Dispatch<React.SetStateAction<VerificationSummary | null>>;
  agentLogs: AgentLog[];
  logAgentAction: (
    agent: AgentRole,
    action: string,
    status?: AgentLog['status'],
    details?: string,
    targetFile?: string
  ) => void;
  clearAgentLogs: () => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export interface AgentProviderProps {
  children: React.ReactNode;
  initialAutonomyMode?: AutonomyMode;
  initialRole?: AgentRole;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  initialAutonomyMode = 'supervised',
  initialRole = 'Architect',
}) => {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>(initialAutonomyMode);
  const [activeAgent, setActiveAgent] = useState<AgentRole>(initialRole);
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus>('idle');
  const [taskPlan, setTaskPlan] = useState<TaskItem[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [autonomousPlan, setAutonomousPlan] = useState<AutonomousPlan | null>(null);
  const [autonomousExecutionState, setAutonomousExecutionState] = useState<AutonomousExecutionState>('idle');
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString(),
      agent: 'Architect',
      action: 'Vertex Forge workspace security boundary initialized',
      status: 'info',
    },
  ]);

  const logAgentAction = useCallback(
    (
      agent: AgentRole,
      action: string,
      status: AgentLog['status'] = 'info',
      details?: string,
      targetFile?: string
    ) => {
      const newLog: AgentLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        agent,
        action,
        status,
        details,
        targetFile,
      };
      setAgentLogs(prev => [newLog, ...prev]);
      logger.info(`[Agent:${agent}] ${action}`, { status, targetFile });
    },
    []
  );

  const clearAgentLogs = useCallback(() => {
    setAgentLogs([]);
  }, []);

  const value = useMemo<AgentContextType>(() => ({
    autonomyMode,
    setAutonomyMode,
    activeAgent,
    setActiveAgent,
    orchestratorStatus,
    setOrchestratorStatus,
    taskPlan,
    setTaskPlan,
    currentTaskIndex,
    setCurrentTaskIndex,
    autonomousPlan,
    setAutonomousPlan,
    autonomousExecutionState,
    setAutonomousExecutionState,
    verificationSummary,
    setVerificationSummary,
    agentLogs,
    logAgentAction,
    clearAgentLogs,
  }), [
    autonomyMode,
    activeAgent,
    orchestratorStatus,
    taskPlan,
    currentTaskIndex,
    autonomousPlan,
    autonomousExecutionState,
    verificationSummary,
    agentLogs,
    logAgentAction,
    clearAgentLogs,
  ]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
