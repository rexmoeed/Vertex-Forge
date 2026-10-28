/**
 * Synthetic Offline Mock Handlers for Cloud & Local AI Endpoints
 * Conforms to Recommendation 04 to guarantee zero network leakage during test execution.
 */

export interface MockApiResponse<T = unknown> {
  status: number;
  data: T;
}

export const mockGeminiResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              status: 'success',
              result: 'Offline synthetic code synthesis result',
            }),
          },
        ],
      },
      finishReason: 'STOP',
    },
  ],
};

export const mockOpenAiResponse = {
  id: 'chatcmpl-mock-offline-123',
  object: 'chat.completion',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'Offline synthetic assistant response',
      },
      finish_reason: 'stop',
    },
  ],
};

export const mockAnthropicResponse = {
  id: 'msg_mock_offline_123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Offline synthetic Claude response',
    },
  ],
};

export const mockOllamaTagsResponse = {
  models: [
    { name: 'deepseek-coder-v2:latest', size: 8900000000, digest: 'sha256:abc123' },
    { name: 'qwen2.5-coder:14b', size: 9100000000, digest: 'sha256:def456' },
    { name: 'llama3.3:latest', size: 8500000000, digest: 'sha256:ghi789' },
  ],
};

export const mockLmStudioModelsResponse = {
  data: [
    { id: 'deepseek-coder-v2-lite', object: 'model', owned_by: 'local' },
    { id: 'qwen2.5-coder-7b', object: 'model', owned_by: 'local' },
  ],
};

