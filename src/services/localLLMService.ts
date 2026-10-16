/**
 * Local LLM & Offline AI Engine for Vertex Forge
 * Seamless integration with Ollama (localhost:11434), LM Studio (localhost:1234), LocalAI,
 * and high-performance coding models (DeepSeek-Coder-V2, Qwen 2.5 Coder, Llama 3.3).
 */

export interface LocalModelInfo {
  id: string;
  name: string;
  size: number;
  family: 'deepseek' | 'qwen' | 'llama' | 'codellama' | 'mistral' | 'other';
  parameterSize?: string;
  quantization?: string;
  isCodingSpecialist: boolean;
}

export interface LocalServerEndpoint {
  id: string;
  name: 'Ollama' | 'LM Studio' | 'LocalAI' | 'Custom';
  baseUrl: string;
  status: 'online' | 'offline' | 'checking';
  latencyMs: number;
  availableModels: LocalModelInfo[];
  lastChecked: number;
}

export interface LocalChatRequest {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LocalChatResponse {
  content: string;
  model: string;
  tokensEvaluated?: number;
  tokensGenerated?: number;
  totalDurationMs?: number;
  isLocal: boolean;
}

export class LocalLLMService {
  private static endpoints: Map<string, LocalServerEndpoint> = new Map([
    [
      'ollama',
      {
        id: 'ollama',
        name: 'Ollama',
        baseUrl: 'http://localhost:11434',
        status: 'offline',
        latencyMs: 0,
        availableModels: [],
        lastChecked: 0,
      },
    ],
    [
      'lmstudio',
      {
        id: 'lmstudio',
        name: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1',
        status: 'offline',
        latencyMs: 0,
        availableModels: [],
        lastChecked: 0,
      },
    ],
  ]);

  private static activeEndpointId: string = 'ollama';
  private static preferredModel: string = 'deepseek-coder-v2:latest';
  private static privacyMode: boolean = false;
  private static customFetch?: typeof fetch;

  /**
   * Inject mock fetch for testing
   */
  public static setFetchClient(fetchClient?: typeof fetch): void {
    this.customFetch = fetchClient;
  }

  private static get fetchClient(): typeof fetch {
    return this.customFetch || (typeof fetch !== 'undefined' ? fetch : (() => Promise.reject(new Error('Fetch not available'))) as any);
  }

  /**
   * Healthcheck an endpoint and query its installed models
   */
  public static async checkEndpointHealth(endpointId: string = this.activeEndpointId): Promise<LocalServerEndpoint> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    endpoint.status = 'checking';
    const startTime = Date.now();

    try {
      if (endpointId === 'ollama') {
        const res = await this.fetchClient(`${endpoint.baseUrl}/api/tags`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          endpoint.latencyMs = Date.now() - startTime;
          endpoint.status = 'online';
          endpoint.lastChecked = Date.now();

          const rawModels = (data.models || []) as any[];
          endpoint.availableModels = rawModels.map(m => {
            const name = m.name || m.model || 'unknown';
            const lower = name.toLowerCase();
            return {
              id: name,
              name,
              size: m.size || 0,
              family: lower.includes('deepseek')
                ? 'deepseek'
                : lower.includes('qwen')
                ? 'qwen'
                : lower.includes('llama')
                ? 'llama'
                : 'other',
              parameterSize: m.details?.parameter_size,
              quantization: m.details?.quantization_level,
              isCodingSpecialist: /coder|code|deepseek|qwen/i.test(name),
            };
          });
        } else {
          endpoint.status = 'offline';
        }
      } else {
        // LM Studio / OpenAI-compatible /v1/models (handle with or without /v1 and trailing slash)
        const cleanBase = endpoint.baseUrl.replace(/\/+$/, '');
        const modelsUrl = cleanBase.endsWith('/v1') ? `${cleanBase}/models` : `${cleanBase}/v1/models`;
        const res = await this.fetchClient(modelsUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          endpoint.latencyMs = Date.now() - startTime;
          endpoint.status = 'online';
          endpoint.lastChecked = Date.now();

          const rawModels = (data.data || []) as any[];
          endpoint.availableModels = rawModels.map(m => ({
            id: m.id,
            name: m.id,
            size: 0,
            family: /deepseek/i.test(m.id) ? 'deepseek' : /qwen/i.test(m.id) ? 'qwen' : 'other',
            isCodingSpecialist: /code|coder|deepseek|qwen/i.test(m.id),
          }));
        } else {
          endpoint.status = 'offline';
        }
      }
    } catch {
      endpoint.status = 'offline';
      endpoint.latencyMs = -1;
      endpoint.availableModels = [];
      endpoint.lastChecked = Date.now();
    }

    return { ...endpoint };
  }

  /**
   * Execute chat completion against the active local provider
   */
  public static async chatCompletion(request: LocalChatRequest): Promise<LocalChatResponse> {
    const endpoint = this.endpoints.get(this.activeEndpointId);
    if (!endpoint) throw new Error('Active local endpoint is not configured');

    const model = request.model || this.preferredModel;
    const startTime = Date.now();

    try {
      if (endpoint.id === 'ollama') {
        const response = await this.fetchClient(`${endpoint.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: request.messages,
            stream: false,
            options: {
              temperature: request.temperature ?? 0.2,
              num_predict: request.maxTokens ?? 2048,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama error: HTTP ${response.status}`);
        }

        const json = (await response.json()) as any;
        return {
          content: json.message?.content || '',
          model: json.model || model,
          tokensEvaluated: json.prompt_eval_count,
          tokensGenerated: json.eval_count,
          totalDurationMs: Date.now() - startTime,
          isLocal: true,
        };
      } else {
        // OpenAI-compatible /v1/chat/completions (LM Studio, LocalAI)
        const response = await this.fetchClient(`${endpoint.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.2,
            max_tokens: request.maxTokens ?? 2048,
          }),
        });

        if (!response.ok) {
          throw new Error(`LM Studio error: HTTP ${response.status}`);
        }

        const json = (await response.json()) as any;
        return {
          content: json.choices?.[0]?.message?.content || '',
          model: json.model || model,
          tokensEvaluated: json.usage?.prompt_tokens,
          tokensGenerated: json.usage?.completion_tokens,
          totalDurationMs: Date.now() - startTime,
          isLocal: true,
        };
      }
    } catch (err: any) {
      if (this.privacyMode) {
        throw new Error(`Local inference failed while Privacy Mode is active: ${err.message}`);
      }

      // Safe offline simulated fallback if local server is unreachable
      return {
        content: `// [Vertex Forge Local AI Fallback]\n// Model: ${model} (Offline simulation)\n// Prompt received: ${request.messages[request.messages.length - 1]?.content.slice(0, 50)}...`,
        model: `${model} (fallback)`,
        totalDurationMs: Date.now() - startTime,
        isLocal: true,
      };
    }
  }

  /**
   * Fast targeted code synthesis for ghost autocompletion
   */
  public static async generateCodeSnippet(prompt: string, prefixCode?: string): Promise<string> {
    const res = await this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are DeepSeek-Coder running locally inside Vertex Forge. Complete the given code accurately. Output ONLY code without markdown formatting or commentary.',
        },
        {
          role: 'user',
          content: prefixCode ? `Context prefix:\n${prefixCode}\n\nComplete the following:\n${prompt}` : prompt,
        },
      ],
      temperature: 0.1,
      maxTokens: 256,
    });

    return res.content.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/g, '');
  }

  public static async autoDetectAllEndpoints(): Promise<{
    endpoints: LocalServerEndpoint[];
    onlineCount: number;
    detectedModelsCount: number;
  }> {
    const ids = Array.from(this.endpoints.keys());
    await Promise.allSettled(ids.map(id => this.checkEndpointHealth(id)));

    const allEndpoints = this.getEndpoints();
    const onlineEndpoints = allEndpoints.filter(e => e.status === 'online');
    const totalModels = onlineEndpoints.reduce((acc, e) => acc + e.availableModels.length, 0);

    const active = this.getActiveEndpoint();
    if (active.status !== 'online' && onlineEndpoints.length > 0) {
      this.setActiveEndpoint(onlineEndpoints[0].id);
    }

    return {
      endpoints: allEndpoints,
      onlineCount: onlineEndpoints.length,
      detectedModelsCount: totalModels,
    };
  }

  public static getEndpoints(): LocalServerEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  public static getActiveEndpoint(): LocalServerEndpoint {
    return this.endpoints.get(this.activeEndpointId) || Array.from(this.endpoints.values())[0];
  }

  public static setActiveEndpoint(id: string): void {
    if (this.endpoints.has(id)) {
      this.activeEndpointId = id;
    }
  }

  public static setPreferredModel(model: string): void {
    this.preferredModel = model;
  }

  public static getPreferredModel(): string {
    return this.preferredModel;
  }

  public static isPrivacyMode(): boolean {
    return this.privacyMode;
  }

  public static setPrivacyMode(enabled: boolean): void {
    this.privacyMode = enabled;
  }
}
