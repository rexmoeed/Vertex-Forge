export interface AIPlanResponse {
  interpretation: string;
  technologyRationale?: string;
  suggestedStack: string;
  clarifications?: string[];
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    agent: any;
    status: 'pending' | 'in-progress' | 'completed';
    targetFile?: string;
  }>;
  proposedFiles?: Array<{
    path: string;
    action: 'create' | 'modify';
    description: string;
  }>;
}

export interface AICodeResponse {
  code: string;
  explanation: string;
  tests?: string;
}

export interface AIDebugResponse {
  rootCause: string;
  explanation: string;
  patch: string;
  verificationCommand: string;
  confidence: number;
}

export interface AICodeReviewResponse {
  overallScore: number;
  summary: string;
  findings: Array<{
    severity: 'high' | 'medium' | 'low' | 'info';
    title: string;
    file: string;
    recommendation: string;
  }>;
}

export class GeminiService {
  public static getApiKey(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        const customKey = localStorage.getItem('vertex_gemini_api_key');
        if (customKey) return customKey;
        const providersRaw = localStorage.getItem('vertex_ai_providers_v2');
        if (providersRaw) {
          const list = JSON.parse(providersRaw);
          const gemini = list.find((p: any) => p.id === 'gemini');
          if (gemini?.apiKey) return gemini.apiKey;
        }
      }
    } catch {}
    return '';
  }

  public static async saveApiKey(apiKey: string): Promise<boolean> {
    try {
      const cleanKey = apiKey.trim();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vertex_gemini_api_key', cleanKey);
      }
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async checkHealth(): Promise<{ status: string; hasApiKey: boolean; defaultModel: string }> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch('/api/health', {
        headers: apiKey ? { 'x-api-key': apiKey } : undefined,
      });
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false, defaultModel: 'gemini-3.8-flash' };
    }
  }

  public static async planProject(params: {
    goal: string;
    currentStack?: string;
    filesSummary?: string;
    model?: string;
    apiKey?: string;
  }): Promise<AIPlanResponse> {
    const key = params.apiKey || this.getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;

    const res = await fetch('/api/ai/plan', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Planning failed: ${res.statusText}`);
    return await res.json();
  }

  public static async generateCode(params: {
    taskTitle: string;
    taskDetails?: string;
    filePath: string;
    currentCode?: string;
    projectContext?: string;
    agentRole?: string;
    model?: string;
    apiKey?: string;
  }): Promise<AICodeResponse> {
    const key = params.apiKey || this.getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;

    const res = await fetch('/api/ai/generate-code', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Code generation failed: ${res.statusText}`);
    return await res.json();
  }

  public static async chat(params: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    activeFile?: string;
    fileContent?: string;
    projectSummary?: string;
    agentRole?: string;
    model?: string;
    apiKey?: string;
    images?: Array<{ data: string; mimeType: string } | string>;
  }): Promise<{ reply: string; agent?: string }> {
    const key = params.apiKey || this.getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.reply || `Chat request failed (${res.status})`);
    }
    return data;
  }

  public static async debugIssue(params: {
    errorLog: string;
    failingFile?: string;
    fileContent?: string;
    testOutput?: string;
    model?: string;
    apiKey?: string;
  }): Promise<AIDebugResponse> {
    const key = params.apiKey || this.getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;

    const res = await fetch('/api/ai/debug', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Debug request failed: ${res.statusText}`);
    return await res.json();
  }

  public static async reviewCode(params: {
    files: Array<{ path: string; content: string }>;
    model?: string;
    apiKey?: string;
  }): Promise<AICodeReviewResponse> {
    const key = params.apiKey || this.getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['x-api-key'] = key;

    const res = await fetch('/api/ai/code-review', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Code review request failed: ${res.statusText}`);
    return await res.json();
  }
}
