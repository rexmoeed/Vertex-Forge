import { describe, it, expect } from 'vitest';
import { mockGeminiProvider, mockAnthropicProvider, mockOpenAIProvider } from '../__mocks__';

describe('Zero-Key Offline AI Mock Adapters', () => {
  it('exercises Gemini mock adapter without network access', async () => {
    const res = await mockGeminiProvider.generateContent('Explain quicksort in TypeScript');
    expect(res.text).toBeDefined();
    expect(res.candidates.length).toBeGreaterThan(0);

    const conn = await mockGeminiProvider.testConnection();
    expect(conn.success).toBe(true);

    const models = await mockGeminiProvider.listModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it('exercises Anthropic mock adapter offline', async () => {
    const res = await mockAnthropicProvider.createMessage([{ role: 'user', content: 'Hello Claude' }]);
    expect(res.content[0].text).toContain('offline');

    const conn = await mockAnthropicProvider.testConnection();
    expect(conn.success).toBe(true);
  });

  it('exercises OpenAI mock adapter offline', async () => {
    const res = await mockOpenAIProvider.createChatCompletion({ messages: [{ role: 'user', content: 'Hello GPT' }] });
    expect(res.choices[0].message.content).toContain('offline');

    const conn = await mockOpenAIProvider.testConnection();
    expect(conn.success).toBe(true);
  });
});
