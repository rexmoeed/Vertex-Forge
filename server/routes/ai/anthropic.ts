import { Request, Response } from 'express';
import { serverLogger } from '../../logger';

export async function handleAnthropicTest(req: Request, res: Response, key: string, model: string, testType: string, startTime: number) {
  if (!key) {
    return res.json({ providerId: 'anthropic', success: false, testType, latencyMs: 0, message: 'Anthropic API key required.', timestamp: Date.now() });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Respond with exactly: VERIFIED' }],
      }),
    });

    const latencyMs = Date.now() - startTime;
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.json({ providerId: 'anthropic', success: false, testType, latencyMs, message: (errData as any)?.error?.message || `Anthropic returned ${response.status}`, timestamp: Date.now() });
    }

    return res.json({ providerId: 'anthropic', success: true, testType, latencyMs, message: `Connected to Anthropic in ${latencyMs}ms.`, timestamp: Date.now() });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return res.json({ providerId: 'anthropic', success: false, testType, latencyMs, message: `Network error: ${error?.message}`, timestamp: Date.now() });
  }
}

export async function handleAnthropicChat(
  req: Request,
  res: Response,
  key: string,
  model: string,
  messages: any[],
  temperature: number,
  maxTokens: number
) {
  if (!key) return res.status(400).json({ error: 'NO_API_KEY', reply: 'Anthropic API key required.' });

  try {
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens || 2048,
        temperature: temperature ?? 0.7,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Anthropic returned ${response.status}`);
    }

    const data = await response.json() as any;
    const replyText = data.content?.map((b: any) => b.text || '').join('') || '';
    return res.json({
      reply: replyText,
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens,
        candidatesTokens: data.usage?.output_tokens,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    });
  } catch (error: any) {
    serverLogger.error({ err: error?.message }, 'Anthropic Chat Error');
    return res.status(500).json({ error: 'UPSTREAM_API_ERROR', reply: `Anthropic error: ${error?.message}` });
  }
}
