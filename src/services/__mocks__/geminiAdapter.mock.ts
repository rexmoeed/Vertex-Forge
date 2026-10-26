/**
 * Mock Adapter for Google Gemini Provider
 * Enables fully offline, zero-network test execution without live API credentials.
 */
export const mockGeminiProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  generateContent: async (prompt: string) => ({
    text: `Mock response for prompt: ${prompt.slice(0, 40)}...`,
    candidates: [{ content: { parts: [{ text: 'Mock AI response generated offline' }] } }],
  }),
  testConnection: async () => ({
    success: true,
    message: 'Mock connection verified offline',
    latencyMs: 12,
  }),
  listModels: async () => [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Mock)', contextWindow: 1000000 },
    { id: 'gemini-3.8-pro', name: 'Gemini 3.8 Pro (Mock)', contextWindow: 2000000 },
  ],
};
