import { serverLogger } from './logger';
import { errorHandler } from './middleware/errorHandler';
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createAiRouter } from './routes/ai.routes';
import { createFsRouter } from './routes/fs.routes';
import { createProcessRouter } from './routes/process.routes';
import { createGitRouter } from './routes/git.routes';
import { createTestRouter } from './routes/test.routes';
import { createJulesRouter } from './routes/jules.routes';

dotenv.config();

export function createApp(): { app: Express; getAiClient: () => GoogleGenAI | null } {
  const app = express();

  // 1. Core Transport Middleware with Body Limits & Security Headers
  app.use(express.json({ limit: '15mb' }));

  // 1.0 OWASP Recommended Security Headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 1.1 Request ID assignment & Structured Request Logging via Pino
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    serverLogger.info({ requestId, method: req.method, path: req.path }, 'Incoming HTTP Request');
    next();
  });

  // 2. Global GenAI Client State
  let currentApiKey = process.env.GEMINI_API_KEY || '';
  let aiClient: GoogleGenAI | null = null;

  function initGenAIClient(key: string) {
    if (!key) {
      aiClient = null;
      return;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      currentApiKey = key;
    } catch (err) {
      serverLogger.error({ err }, 'Failed to initialize GoogleGenAI');
    }
  }

  if (currentApiKey) {
    initGenAIClient(currentApiKey);
  }

  const getAiClient = () => aiClient;
  const setApiKey = (key: string) => initGenAIClient(key);
  const getApiKey = () => currentApiKey;

  // 3. Healthcheck Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Vertex Forge Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      errorTracking: {
        provider: process.env.SENTRY_DSN ? 'sentry' : 'pino-structured',
        configured: Boolean(process.env.SENTRY_DSN),
      },
    });
  });

  // 3.1 Simulated Error Endpoint for Diagnostics & Integration Testing
  app.get('/api/simulate-error', () => {
    throw new Error('Simulated unhandled server exception for error tracking verification');
  });

  // 4. Mount Domain Routers (Layered Architecture)
  app.use(createAiRouter(getAiClient, setApiKey, getApiKey));
  app.use(createFsRouter());
  app.use(createProcessRouter());
  app.use(createGitRouter(getAiClient));
  app.use(createTestRouter(getAiClient));
  app.use(createJulesRouter());

  // 5. Global Error Handling Middleware with Structured Logging
  app.use(errorHandler);

  return { app, getAiClient };
}
