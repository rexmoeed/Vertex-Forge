import { TaskModelRoute, TaskRoutingCategory } from '../types/kos';

const ROUTING_STORAGE_KEY = 'vertex_model_routing_v1';

export class ModelRouterService {
  private static routes: Record<TaskRoutingCategory, TaskModelRoute> = {
    autocomplete: {
      category: 'autocomplete',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      fallbackChain: [{ provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct' }],
      maxTokens: 128,
      temperature: 0.1,
      costCeilingPerReqUsd: 0.00005,
    },
    chat_qa: {
      category: 'chat_qa',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-3.8-flash',
      fallbackChain: [
        { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' },
        { provider: 'anthropic', model: 'claude-3-7-sonnet' },
      ],
      maxTokens: 4096,
      temperature: 0.4,
      costCeilingPerReqUsd: 0.002,
    },
    inline_edit: {
      category: 'inline_edit',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-3.8-flash',
      fallbackChain: [{ provider: 'openrouter', model: 'anthropic/claude-3.7-sonnet' }],
      maxTokens: 2048,
      temperature: 0.2,
      costCeilingPerReqUsd: 0.001,
    },
    agent_planning: {
      category: 'agent_planning',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-pro',
      fallbackChain: [
        { provider: 'openrouter', model: 'deepseek/deepseek-r1' },
        { provider: 'anthropic', model: 'claude-3-7-sonnet' },
      ],
      maxTokens: 8192,
      temperature: 0.2,
      costCeilingPerReqUsd: 0.005,
    },
    code_generation: {
      category: 'code_generation',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-3.8-flash',
      fallbackChain: [{ provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct' }],
      maxTokens: 4096,
      temperature: 0.2,
      costCeilingPerReqUsd: 0.002,
    },
    code_review: {
      category: 'code_review',
      primaryProvider: 'openrouter',
      primaryModel: 'anthropic/claude-3.5-sonnet',
      fallbackChain: [{ provider: 'gemini', model: 'gemini-2.5-pro' }],
      maxTokens: 4096,
      temperature: 0.1,
      costCeilingPerReqUsd: 0.004,
    },
    summarization: {
      category: 'summarization',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      fallbackChain: [{ provider: 'openai', model: 'gpt-4o-mini' }],
      maxTokens: 1024,
      temperature: 0.3,
      costCeilingPerReqUsd: 0.0003,
    },
    commit_message: {
      category: 'commit_message',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      fallbackChain: [{ provider: 'openai', model: 'gpt-4o-mini' }],
      maxTokens: 256,
      temperature: 0.2,
      costCeilingPerReqUsd: 0.0001,
    },
    embeddings: {
      category: 'embeddings',
      primaryProvider: 'gemini',
      primaryModel: 'text-embedding-004',
      fallbackChain: [],
      maxTokens: 512,
      temperature: 0.0,
      costCeilingPerReqUsd: 0.00002,
    },
    council_judge: {
      category: 'council_judge',
      primaryProvider: 'gemini',
      primaryModel: 'gemini-2.5-pro',
      fallbackChain: [{ provider: 'openrouter', model: 'deepseek/deepseek-r1' }],
      maxTokens: 2048,
      temperature: 0.1,
      costCeilingPerReqUsd: 0.003,
    },
  };

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(ROUTING_STORAGE_KEY);
        if (stored) {
          this.routes = { ...this.routes, ...JSON.parse(stored) };
        }
      }
    } catch {}
  }

  public static getRoute(category: TaskRoutingCategory): TaskModelRoute {
    return this.routes[category];
  }

  public static listRoutes(): TaskModelRoute[] {
    return Object.values(this.routes);
  }

  public static updateRoute(category: TaskRoutingCategory, updates: Partial<TaskModelRoute>): void {
    if (this.routes[category]) {
      this.routes[category] = { ...this.routes[category], ...updates };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(this.routes));
        }
      } catch {}
    }
  }
}
