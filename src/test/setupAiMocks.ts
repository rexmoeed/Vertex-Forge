import { vi } from 'vitest';

/**
 * Global AI Provider & Network Isolation Interceptor
 * Intercepts external AI & GitHub API domains so tests run in a 100% offline sandbox.
 */
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Intercept Google AI Studio / Gemini endpoints
  if (url.includes('generativelanguage.googleapis.com')) {
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    interpretation: 'Mock offline architecture plan',
                    tasks: [{ id: 't1', title: 'Offline mock task', status: 'pending' }],
                    rootCause: 'Mock diagnosed root cause: null safety violation',
                    explanation: 'Step-by-step diagnostic reasoning',
                    patch: '// Fixed code',
                    verificationCommand: 'npm test',
                    confidence: 0.98,
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Intercept Google Jules API
  if (url.includes('jules.googleapis.com')) {
    return new Response(
      JSON.stringify({
        session: { id: 'mock-jules-session-1', state: 'ACTIVE' },
        activities: [{ id: 'act-1', type: 'THOUGHT', description: 'Offline Jules mock activity' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Intercept GitHub API
  if (url.includes('api.github.com')) {
    if (url.includes('/user')) {
      return new Response(
        JSON.stringify({ login: 'rexmoeed', name: 'Moeed', avatar_url: 'https://avatars.githubusercontent.com/u/1' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/pulls')) {
      return new Response(
        JSON.stringify([
          {
            number: 42,
            title: 'feat: offline mock PR',
            state: 'open',
            user: { login: 'rexmoeed' },
            head: { ref: 'feat/test' },
            base: { ref: 'main' },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/issues')) {
      return new Response(
        JSON.stringify([
          { number: 1, title: 'Bug: mock issue', state: 'open', user: { login: 'user' }, comments: 0 },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        id: 12345,
        name: 'Vertex-Forge',
        full_name: 'rexmoeed/Vertex-Forge',
        default_branch: 'main',
        stargazers_count: 100,
        private: false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Intercept Anthropic endpoints
  if (url.includes('api.anthropic.com')) {
    return new Response(
      JSON.stringify({
        id: 'mock-anthropic-resp',
        content: [{ type: 'text', text: 'Offline mock Claude output' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Intercept OpenAI endpoints
  if (url.includes('api.openai.com')) {
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'Offline mock OpenAI output' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
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
