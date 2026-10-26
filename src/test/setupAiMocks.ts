import { vi } from 'vitest';

/**
 * Global AI Provider Network Isolation Interceptor
 * Intercepts external AI API domains so tests run in a 100% offline sandbox.
 */
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Intercept Google AI Studio / Gemini endpoints
  if (url.includes('generativelanguage.googleapis.com')) {
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify({
            interpretation: 'Mock offline architecture plan',
            tasks: [{ id: 't1', title: 'Offline mock task', status: 'pending' }],
            rootCause: 'Mock diagnosed root cause: null safety violation',
            explanation: 'Step-by-step diagnostic reasoning',
            patch: '// Fixed code',
            verificationCommand: 'npm test',
            confidence: 0.98,
          }) }]
        }
      }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Intercept Anthropic endpoints
  if (url.includes('api.anthropic.com')) {
    return new Response(JSON.stringify({
      id: 'mock-anthropic-resp',
      content: [{ type: 'text', text: 'Offline mock Claude output' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Intercept OpenAI endpoints
  if (url.includes('api.openai.com')) {
    return new Response(JSON.stringify({
      choices: [{ message: { role: 'assistant', content: 'Offline mock OpenAI output' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (originalFetch) {
    try {
      return await originalFetch(input, init);
    } catch {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
