import { serverLogger } from './logger';
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

  // 1. Core Transport Middleware with Body Limits
  app.use(express.json({ limit: '15mb' }));
  // 1.1 Structured Request Logging via Pino
  app.use((req: Request, res: Response, next: NextFunction) => {
    serverLogger.info({ method: req.method, path: req.path }, 'Incoming HTTP Request');
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
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Vertex Forge Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // 4. Mount Domain Routers (Layered Architecture)
  app.use(createAiRouter(getAiClient, setApiKey, getApiKey));
  app.use(createFsRouter());
  app.use(createProcessRouter());
  app.use(createGitRouter(getAiClient));
  app.use(createTestRouter(getAiClient));
  app.use(createJulesRouter());

  // 5. Global Error Handling Middleware with Structured Logging
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    serverLogger.error({
      err: {
        message: err.message,
        stack: err.stack,
        status: err.status || 500,
      },
      method: req.method,
      path: req.path,
      query: req.query,
    }, 'Unhandled server exception caught by middleware');

    res.status(err.status || 500).json({
      status: 'error',
      error: err.message || 'Internal server error',
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  });

  return { app, getAiClient };
}
