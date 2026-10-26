import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { serverLogger } from '../../logger';
import { AiRouterContext } from './types';

export async function handleGeminiTest(req: Request, res: Response, key: string, model: string, testType: string, startTime: number) {
  if (!key) {
    return res.json({
      providerId: 'gemini',
      success: false,
      testType,
      latencyMs: 0,
      message: 'No Google Gemini API key provided. Please input your API key.',
      timestamp: Date.now(),
    });
  }

  try {
    const client = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await client.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: 'Respond with exactly the single word "VERIFIED".',
      config: { maxOutputTokens: 10, temperature: 0.1 },
    });

    const latencyMs = Date.now() - startTime;
    return res.json({
      providerId: 'gemini',
      success: true,
      testType,
      latencyMs,
      message: `Connected successfully to Google Gemini (${model || 'gemini-3.8-flash'}) in ${latencyMs}ms. Response: ${response.text?.trim() || 'OK'}`,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    serverLogger.error({ err: error?.message }, 'Gemini test failed');
    return res.json({
      providerId: 'gemini',
      success: false,
      testType,
      latencyMs,
      message: `Failed to connect to Google Gemini: ${error?.message || 'Authentication error'}`,
      timestamp: Date.now(),
    });
  }
}

export async function handleGeminiChat(
  req: Request,
  res: Response,
  ctx: AiRouterContext,
  key: string,
  model: string,
  messages: any[],
  temperature: number,
  maxTokens: number
) {
  const client = (key ? new GoogleGenAI({ apiKey: key }) : ctx.getGenAIClient(req)) || ctx.getAiClient();
  if (!client) {
    return res.status(400).json({
      error: 'NO_API_KEY',
      reply: 'Google Gemini API key required. Please configure your API key in AI Provider Hub or .env file.',
    });
  }

  try {
    const lastMsg = messages[messages.length - 1]?.content || 'Hello';
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: [...history, { role: 'user', parts: [{ text: lastMsg }] }],
      config: {
        temperature: temperature ?? 0.7,
        maxOutputTokens: maxTokens || 2048,
      },
    });

    return res.json({
      reply: response.text || 'No response generated.',
      model: model || 'gemini-3.8-flash',
      usage: {
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    });
  } catch (error: any) {
    serverLogger.error({ err: error?.message }, 'Gemini Chat API Error');
    return res.status(500).json({
      error: 'UPSTREAM_API_ERROR',
      reply: `Google Gemini Error: ${error?.message || 'Failed to generate response'}`,
    });
  }
}
