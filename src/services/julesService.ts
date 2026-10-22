import { logger } from './logger';
/**
 * Google Jules Cloud Agent Service
 * Integrates Google's asynchronous cloud coding agent with Vertex Forge.
 * Handles autonomous coding missions, GitHub cloud VMs, plan approvals, and PR workflows.
 */

export interface JulesSource {
  name: string;
  id: string;
  githubRepo?: {
    owner: string;
    repo: string;
    defaultBranch?: {
      displayName: string;
    };
    branches?: Array<{
      displayName: string;
    }>;
  };
}

export interface JulesSession {
  name: string;
  id?: string;
  title?: string;
  prompt: string;
  state?: 'STATE_UNSPECIFIED' | 'INITIALIZING' | 'PLANNING' | 'AWAITING_PLAN_APPROVAL' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requirePlanApproval?: boolean;
  createTime?: string;
  updateTime?: string;
  sourceContext?: {
    source: string;
    githubRepoContext?: {
      startingBranch?: string;
    };
  };
  outputs?: {
    pullRequest?: {
      url: string;
      title: string;
      number: number;
    };
  };
}

export interface JulesActivity {
  name: string;
  createTime: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateJulesSessionOptions {
  prompt: string;
  title?: string;
  source: string; // e.g. "sources/github/owner/repo"
  startingBranch?: string;
  requirePlanApproval?: boolean;
}

export class JulesService {
  private static instance: JulesService;

  public static getInstance(): JulesService {
    if (!JulesService.instance) {
      JulesService.instance = new JulesService();
    }
    return JulesService.instance;
  }

  /**
   * Fetch connected GitHub repositories registered with Jules
   */
  public async listSources(): Promise<JulesSource[]> {
    try {
      const response = await fetch('/api/jules/sources');
      if (!response.ok) {
        throw new Error(`Failed to fetch Jules sources: HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.sources || [];
    } catch (err) {
      logger.error('[JulesService] listSources error:', err);
      throw err;
    }
  }

  /**
   * List recent Jules coding sessions
   */
  public async listSessions(): Promise<JulesSession[]> {
    try {
      const response = await fetch('/api/jules/sessions');
      if (!response.ok) {
        throw new Error(`Failed to fetch Jules sessions: HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.sessions || [];
    } catch (err) {
      logger.error('[JulesService] listSessions error:', err);
      throw err;
    }
  }

  /**
   * Launch a new autonomous coding session with Jules
   */
  public async createSession(options: CreateJulesSessionOptions): Promise<JulesSession> {
    try {
      const payload = {
        prompt: options.prompt,
        title: options.title || options.prompt.slice(0, 60),
        sourceContext: {
          source: options.source,
          githubRepoContext: {
            startingBranch: options.startingBranch || 'main',
          },
        },
        requirePlanApproval: options.requirePlanApproval ?? false,
      };

      const response = await fetch('/api/jules/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      logger.error('[JulesService] createSession error:', err);
      throw err;
    }
  }

  /**
   * Get detailed status and outputs of an active or completed session
   */
  public async getSession(sessionId: string): Promise<JulesSession> {
    try {
      const cleanId = sessionId.replace(/^sessions\//, '');
      const response = await fetch(`/api/jules/sessions/${encodeURIComponent(cleanId)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      logger.error('[JulesService] getSession error:', err);
      throw err;
    }
  }

  /**
   * Get audit log and execution activities for a session
   */
  public async getActivities(sessionId: string): Promise<JulesActivity[]> {
    try {
      const cleanId = sessionId.replace(/^sessions\//, '');
      const response = await fetch(`/api/jules/sessions/${encodeURIComponent(cleanId)}/activities`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.activities || [];
    } catch (err) {
      logger.error('[JulesService] getActivities error:', err);
      throw err;
    }
  }

  /**
   * Approve plan for an autonomous task awaiting user sign-off
   */
  public async approvePlan(sessionId: string): Promise<boolean> {
    try {
      const cleanId = sessionId.replace(/^sessions\//, '');
      const response = await fetch(`/api/jules/sessions/${encodeURIComponent(cleanId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return response.ok;
    } catch (err) {
      logger.error('[JulesService] approvePlan error:', err);
      return false;
    }
  }

  /**
   * Send instructions or review feedback to Jules mid-session
   */
  public async sendMessage(sessionId: string, message: string): Promise<boolean> {
    try {
      const cleanId = sessionId.replace(/^sessions\//, '');
      const response = await fetch(`/api/jules/sessions/${encodeURIComponent(cleanId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message }),
      });
      return response.ok;
    } catch (err) {
      logger.error('[JulesService] sendMessage error:', err);
      return false;
    }
  }
}

export const julesService = JulesService.getInstance();
