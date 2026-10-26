/**
 * Mock Adapter for Anthropic Claude Provider
 */
export const mockAnthropicProvider = {
  id: 'anthropic',
  name: 'Anthropic Claude',
  createMessage: async (messages: any[]) => ({
    id: 'mock-msg-1',
    content: [{ type: 'text', text: 'Mock Claude response generated offline' }],
    model: 'claude-3-7-sonnet',
  }),
  testConnection: async () => ({
    success: true,
    message: 'Mock Anthropic connection verified offline',
    latencyMs: 15,
  }),
  listModels: async () => [
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Mock)', contextWindow: 200000 },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Mock)', contextWindow: 200000 },
  ],
};
