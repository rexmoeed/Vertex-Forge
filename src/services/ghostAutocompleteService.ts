/**
 * Inline Ghost-Text & Speculative Autocomplete Service for Vertex Forge
 * Provides Cursor/Copilot-style predictive multi-line inline completions,
 * Tab-to-accept state tracking, LRU debounced caching, and local AI synthesis.
 */

import { LocalLLMService } from './localLLMService';
import { logger } from './logger';

export interface GhostCompletionContext {
  fileUri: string;
  language: string;
  prefix: string; // Text before cursor
  suffix: string; // Text after cursor
  lineNumber: number;
  column: number;
  maxLines?: number;
}

export interface GhostSuggestion {
  id: string;
  insertText: string;
  snippet?: string;
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  source: 'local_llm' | 'heuristic_ast' | 'cached';
  confidence: number;
  timestamp: number;
}

export interface GhostCompletionStats {
  suggestionsOffered: number;
  suggestionsAccepted: number;
  suggestionsDiscarded: number;
  acceptanceRatePercent: number;
  averageLatencyMs: number;
}

export class GhostAutocompleteService {
  private static cache: Map<string, GhostSuggestion> = new Map();
  private static maxCacheEntries = 64;
  private static currentSuggestion?: GhostSuggestion;
  private static isEnabled: boolean = true;
  private static debounceTimer?: any;
  private static debounceDelayMs: number = 150;

  private static stats: GhostCompletionStats = {
    suggestionsOffered: 0,
    suggestionsAccepted: 0,
    suggestionsDiscarded: 0,
    acceptanceRatePercent: 0,
    averageLatencyMs: 0,
  };

  /**
   * Request speculative inline completion based on current cursor context
   */
  public static async requestCompletion(ctx: GhostCompletionContext): Promise<GhostSuggestion | null> {
    if (!this.isEnabled || !ctx.prefix.trim()) {
      return null;
    }

    const cacheKey = this.computeCacheKey(ctx);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.currentSuggestion = cached;
      return cached;
    }

    const startTime = Date.now();
    let insertText = '';
    let source: GhostSuggestion['source'] = 'heuristic_ast';
    let confidence = 0.85;

    // 1. Evaluate Heuristic Patterns (Instant sub-10ms response)
    const heuristic = this.evaluateHeuristicPattern(ctx.prefix, ctx.language);
    if (heuristic) {
      insertText = heuristic;
      source = 'heuristic_ast';
      confidence = 0.95;
    } else {
      // 2. Synthesize via LocalLLM (e.g. DeepSeek-Coder-V2)
      try {
        const promptLines = ctx.prefix.split('\n');
        const lastLine = promptLines[promptLines.length - 1];
        const precedingContext = promptLines.slice(-15).join('\n');

        const aiCode = await LocalLLMService.generateCodeSnippet(lastLine, precedingContext);
        if (aiCode && aiCode.trim().length > 0) {
          insertText = aiCode;
          source = 'local_llm';
          confidence = 0.88;
        }
      } catch {
        // Fallback to pattern completion
        insertText = this.genericPatternFallback(ctx.prefix, ctx.language);
      }
    }

    if (!insertText) {
      return null;
    }

    const suggestion: GhostSuggestion = {
      id: `ghost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      insertText,
      source,
      confidence,
      timestamp: Date.now(),
      range: {
        startLineNumber: ctx.lineNumber,
        startColumn: ctx.column,
        endLineNumber: ctx.lineNumber,
        endColumn: ctx.column,
      },
    };

    // Update LRU cache
    if (this.cache.size >= this.maxCacheEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, suggestion);

    this.currentSuggestion = suggestion;
    this.stats.suggestionsOffered += 1;

    const latency = Date.now() - startTime;
    this.stats.averageLatencyMs = Math.round(
      (this.stats.averageLatencyMs * (this.stats.suggestionsOffered - 1) + latency) / this.stats.suggestionsOffered
    );

    return suggestion;
  }

  /**
   * Fast rule-based AST heuristics for instant code generation
   */
  private static evaluateHeuristicPattern(prefix: string, language: string): string | null {
    const trimmed = prefix.trimEnd();

    // TypeScript/JS patterns
    if (language === 'typescript' || language === 'javascript' || language === 'typescriptreact' || language === 'javascriptreact') {
      if (/export\s+interface\s+[A-Za-z0-9_]+\s*\{?$/m.test(trimmed)) {
        return '\n  id: string;\n  name: string;\n  createdAt: number;\n}';
      }

      if (/const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState(<[^>]*>)?$/i.test(trimmed)) {
        return "(false);\n";
      }

      if (/useEffect\(\(\)\s*=>\s*\{?$/m.test(trimmed)) {
        return '\n  return () => {\n    // cleanup\n  };\n}, []);';
      }

      if (/try\s*\{?$/m.test(trimmed)) {
        return '\n  // perform operation\n} catch (error) {\n  logger.error("Operation failed:", error);\n}';
      }

      if (/export\s+const\s+[A-Za-z0-9_]+\s*=\s*async\s*\([^)]*\)\s*=>\s*\{?$/m.test(trimmed)) {
        return '\n  try {\n    return { success: true };\n  } catch (error) {\n    return { success: false, error };\n  }\n};';
      }

      if (/return\s*\(\s*<div\s*className="[^"]*"?$/m.test(trimmed)) {
        return '>\n      <h1>Title</h1>\n    </div>\n  );';
      }
    }

    // Python patterns
    if (language === 'python') {
      if (/def\s+[a-z0-9_]+\([^)]*\):\s*$/m.test(trimmed)) {
        return '\n    """TODO: implementation documentation"""\n    pass';
      }
      if (/if\s+__name__\s*==\s*['"]__main__['"]:\s*$/m.test(trimmed)) {
        return '\n    main()';
      }
    }

    // CSS patterns
    if (language === 'css' || language === 'scss') {
      if (/\.([a-z0-9_-]+)\s*\{?$/m.test(trimmed)) {
        return '\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}';
      }
    }

    return null;
  }

  private static genericPatternFallback(prefix: string, language: string): string {
    if (prefix.endsWith('(')) return ')';
    if (prefix.endsWith('{')) return '\n}';
    if (prefix.endsWith('[')) return ']';
    return '';
  }

  /**
   * Action when user presses Tab to accept the current ghost completion
   */
  public static acceptCurrentSuggestion(): GhostSuggestion | null {
    if (!this.currentSuggestion) return null;

    const accepted = this.currentSuggestion;
    this.stats.suggestionsAccepted += 1;
    this.updateAcceptanceRate();
    this.currentSuggestion = undefined;
    return accepted;
  }

  /**
   * Discard current suggestion on typing divergence or Escape
   */
  public static discardCurrentSuggestion(): void {
    if (this.currentSuggestion) {
      this.stats.suggestionsDiscarded += 1;
      this.updateAcceptanceRate();
      this.currentSuggestion = undefined;
    }
  }

  private static updateAcceptanceRate(): void {
    const total = this.stats.suggestionsAccepted + this.stats.suggestionsDiscarded;
    this.stats.acceptanceRatePercent = total > 0 ? Math.round((this.stats.suggestionsAccepted / total) * 100) : 0;
  }

  public static getCurrentSuggestion(): GhostSuggestion | undefined {
    return this.currentSuggestion;
  }

  public static getStats(): GhostCompletionStats {
    return { ...this.stats };
  }

  public static clearCache(): void {
    this.cache.clear();
    this.currentSuggestion = undefined;
  }

  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public static isAutocompletionEnabled(): boolean {
    return this.isEnabled;
  }

  private static computeCacheKey(ctx: GhostCompletionContext): string {
    const tail = ctx.prefix.slice(-60);
    return `${ctx.fileUri}:${ctx.lineNumber}:${ctx.column}:${tail}`;
  }
}
