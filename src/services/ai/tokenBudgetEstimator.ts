/**
 * AI Token Budget Estimator & Context Window Pruner
 * Computes heuristic BPE token approximations and trims prompt histories safely.
 */

export interface TokenCountEstimate {
  estimatedTokens: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
}

export interface ChatMessageLike {
  role: string;
  content: string;
}

export class TokenBudgetEstimator {
  /**
   * Average characters per token across common LLM tokenizers (cl100k, Llama, Gemini).
   * Code typically has ~3.2 chars/token, prose ~4.0 chars/token. Heuristic 3.6 chars/token.
   */
  public static readonly CHARS_PER_TOKEN = 3.6;

  public static estimateTokens(text: string): TokenCountEstimate {
    if (!text || text.length === 0) {
      return {
        estimatedTokens: 0,
        characterCount: 0,
        wordCount: 0,
        lineCount: 0,
      };
    }

    const characterCount = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines = text.split('\n');
    const estimatedTokens = Math.max(1, Math.ceil(characterCount / this.CHARS_PER_TOKEN));

    return {
      estimatedTokens,
      characterCount,
      wordCount: words.length,
      lineCount: lines.length,
    };
  }

  public static pruneMessageHistory<T extends ChatMessageLike>(
    messages: T[],
    maxTokenBudget: number,
    preserveSystem = true
  ): T[] {
    if (messages.length === 0) return [];

    let systemMessage: T | null = null;
    let candidates = [...messages];

    if (preserveSystem && messages[0]?.role === 'system') {
      systemMessage = messages[0];
      candidates = messages.slice(1);
    }

    let currentTokens = systemMessage ? this.estimateTokens(systemMessage.content).estimatedTokens : 0;
    const kept: T[] = [];

    // Walk backwards from newest messages to oldest
    for (let i = candidates.length - 1; i >= 0; i--) {
      const msg = candidates[i];
      const msgTokens = this.estimateTokens(msg.content).estimatedTokens;

      if (currentTokens + msgTokens <= maxTokenBudget) {
        kept.unshift(msg);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }

    if (systemMessage) {
      return [systemMessage, ...kept];
    }
    return kept;
  }
}

