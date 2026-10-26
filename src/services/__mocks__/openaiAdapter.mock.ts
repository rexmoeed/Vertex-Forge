/**
 * Mock Adapter for OpenAI Provider
 */
export const mockOpenAIProvider = {
  id: 'openai',
  name: 'OpenAI',
  createChatCompletion: async (params: any) => ({
    id: 'mock-chatcmpl-1',
    choices: [{ message: { role: 'assistant', content: 'Mock OpenAI completion generated offline' } }],
  }),
  testConnection: async () => ({
    success: true,
    message: 'Mock OpenAI connection verified offline',
    latencyMs: 18,
  }),
  listModels: async () => [
    { id: 'gpt-4o', name: 'GPT-4o (Mock)', contextWindow: 128000 },
    { id: 'o3-mini', name: 'o3-mini (Mock)', contextWindow: 128000 },
  ],
};
