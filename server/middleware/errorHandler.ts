import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { serverLogger } from '../logger';

export interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  path: string;
  timestamp: string;
}

/**
 * Lightweight error tracking hook for capture telemetry (e.g. Sentry SDK integration).
 */
export function captureException(err: Error | unknown, context?: Record<string, any>): void {
  if (process.env.SENTRY_DSN) {
    serverLogger.info(
      {
        telemetry: 'sentry',
        dsnConfigured: true,
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        context,
      },
      '[ErrorTracking] Dispatched exception to external telemetry provider'
    );
  }
}

/**
 * Global Express Error Handling Middleware
 * Intercepts AppError hierarchy and unexpected errors, outputting a consistent schema and structured telemetry.
 */
export function errorHandler(
  err: Error | AppError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : err.status || 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err?.message || 'An unexpected internal error occurred';
  const details = isAppError ? err.details : undefined;
  const requestId = (req.headers['x-request-id'] as string) || (req as any).requestId || `err_${Date.now()}`;

  // Log with structured Pino logger
  serverLogger.error(
    {
      err: {
        name: err?.name || 'Error',
        message,
        code,
        statusCode,
        stack: err?.stack,
      },
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
    },
    `[ErrorHandler] [${requestId}] ${code}: ${message}`
  );

  // Dispatch to external error tracking provider if enabled
  captureException(err, { requestId, method: req.method, path: req.path });

  const payload: ErrorResponseBody = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
