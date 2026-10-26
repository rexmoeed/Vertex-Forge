/**
 * AI Routes Facade (Modularized under server/routes/ai/)
 * Decomposed into per-provider handlers (gemini.ts, anthropic.ts, jules.ts, workflows.ts).
 */
export { createAiRouter, default } from './ai/index';
export * from './ai/types';
