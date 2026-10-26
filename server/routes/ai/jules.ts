import { Request, Response } from 'express';
import { serverLogger } from '../../logger';

export async function handleJulesTest(req: Request, res: Response, key: string, testType: string, startTime: number) {
  const julesKey = key || process.env.JULES_API_KEY;
  if (!julesKey) {
    return res.json({
      providerId: 'jules',
      success: false,
      testType,
      latencyMs: 0,
      message: 'Google Jules API key required. Set JULES_API_KEY in .env or enter your key.',
      timestamp: Date.now(),
    });
  }

  try {
    const julesRes = await fetch('https://jules.googleapis.com/v1alpha/sources', {
      headers: { 'x-goog-api-key': julesKey },
    });

    const latencyMs = Date.now() - startTime;
    if (julesRes.ok || julesRes.status === 404) {
      return res.json({
        providerId: 'jules',
        success: true,
        testType,
        latencyMs,
        message: `Connected to Google Jules Cloud API in ${latencyMs}ms. Autonomous engineering agent ready.`,
        timestamp: Date.now(),
      });
    }

    const errBody = await julesRes.json().catch(() => ({}));
    return res.json({
      providerId: 'jules',
      success: false,
      testType,
      latencyMs,
      message: (errBody as any)?.error?.message || `Google Jules responded with HTTP ${julesRes.status}`,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    serverLogger.warn({ err: err?.message }, 'Jules connection check failed');
    return res.json({
      providerId: 'jules',
      success: false,
      testType,
      latencyMs,
      message: `Google Jules connection error: ${err?.message || 'Network failure'}`,
      timestamp: Date.now(),
    });
  }
}
