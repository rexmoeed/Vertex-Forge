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
  path: string;
  timestamp: string;
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
  const message = err.message || 'An unexpected internal error occurred';
  const details = isAppError ? err.details : undefined;

  // Log with structured Pino logger
  serverLogger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        code,
        statusCode,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
      method: req.method,
      path: req.path,
      query: req.query,
    },
    `[ErrorHandler] ${code}: ${message}`
  );

  const payload: ErrorResponseBody = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
