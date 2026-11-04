import { describe, it, expect } from 'vitest';
import { TokenBudgetEstimator } from '../tokenBudgetEstimator';

describe('TokenBudgetEstimator & Context Pruning', () => {
  it('estimates token counts accurately for text', () => {
    const text = 'Hello world, this is a test prompt for Vertex Forge LLM orchestration.';
    const estimate = TokenBudgetEstimator.estimateTokens(text);

    expect(estimate.characterCount).toBe(text.length);
    expect(estimate.wordCount).toBe(12);
    expect(estimate.lineCount).toBe(1);
    expect(estimate.estimatedTokens).toBeGreaterThan(10);
    expect(estimate.estimatedTokens).toBeLessThan(30);
  });

  it('handles empty strings gracefully', () => {
    const estimate = TokenBudgetEstimator.estimateTokens('');
    expect(estimate.estimatedTokens).toBe(0);
    expect(estimate.wordCount).toBe(0);
  });

  it('prunes oldest conversational messages while preserving system prompt', () => {
    const messages = [
      { role: 'system', content: 'You are an expert AI architect.' },
      { role: 'user', content: 'Message 1 that is very old and should be pruned.' },
      { role: 'assistant', content: 'Response 1 from the model.' },
      { role: 'user', content: 'Message 2 that is recent.' },
      { role: 'assistant', content: 'Response 2 that is the latest.' },
    ];

    // Restrict budget so only system prompt + the latest 2 messages fit
    const pruned = TokenBudgetEstimator.pruneMessageHistory(messages, 45, true);

    expect(pruned[0].role).toBe('system');
    expect(pruned[pruned.length - 1].content).toBe('Response 2 that is the latest.');
    expect(pruned.length).toBeLessThan(messages.length);
  });

  it('keeps all messages if token budget is ample', () => {
    const messages = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ];

    const pruned = TokenBudgetEstimator.pruneMessageHistory(messages, 5000);
    expect(pruned.length).toBe(2);
  });
});
