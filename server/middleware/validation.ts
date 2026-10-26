import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  required?: string[];
  types?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
  patterns?: Record<string, RegExp>;
  maxLengths?: Record<string, number>;
  minLengths?: Record<string, number>;
  custom?: (body: any) => string | null;
}

/**
 * Higher-order middleware for API boundary input validation
 */
export function validateBody(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid payload: Request body must be a JSON object.' });
      return;
    }

    // Required fields check
    if (schema.required) {
      for (const field of schema.required) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
          res.status(400).json({
            error: `Validation error: Missing required field '${field}'.`,
            field,
          });
          return;
        }
      }
    }

    // Type validation
    if (schema.types) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        if (body[field] !== undefined && body[field] !== null) {
          const actualType = Array.isArray(body[field]) ? 'array' : typeof body[field];
          if (actualType !== expectedType) {
            res.status(400).json({
              error: `Validation error: Field '${field}' must be of type '${expectedType}' (received '${actualType}').`,
              field,
            });
            return;
          }
        }
      }
    }

    // Length checks
    if (schema.maxLengths) {
      for (const [field, max] of Object.entries(schema.maxLengths)) {
        if (typeof body[field] === 'string' && body[field].length > max) {
          res.status(400).json({
            error: `Validation error: Field '${field}' exceeds maximum length of ${max} characters.`,
            field,
          });
          return;
        }
      }
    }

    if (schema.minLengths) {
      for (const [field, min] of Object.entries(schema.minLengths)) {
        if (typeof body[field] === 'string' && body[field].trim().length < min) {
          res.status(400).json({
            error: `Validation error: Field '${field}' must be at least ${min} characters.`,
            field,
          });
          return;
        }
      }
    }

    // Pattern matching
    if (schema.patterns) {
      for (const [field, regex] of Object.entries(schema.patterns)) {
        if (typeof body[field] === 'string' && !regex.test(body[field])) {
          res.status(400).json({
            error: `Validation error: Field '${field}' does not match expected format.`,
            field,
          });
          return;
        }
      }
    }

    // Custom validator
    if (schema.custom) {
      const customErr = schema.custom(body);
      if (customErr) {
        res.status(400).json({ error: `Validation error: ${customErr}` });
        return;
      }
    }

    next();
  };
}

// Pre-configured validation schemas for API boundaries
export const CommonSchemas: Record<string, ValidationSchema> = {
  aiChat: {
    required: ['messages'],
    types: { messages: 'array' },
    custom: (body: any) => {
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return 'Messages array cannot be empty.';
      }
      return null;
    },
  },
  aiPrompt: {
    required: ['prompt'],
    types: { prompt: 'string' },
    minLengths: { prompt: 1 },
    maxLengths: { prompt: 50000 },
  },
  fsPath: {
    required: ['path'],
    types: { path: 'string' },
    minLengths: { path: 1 },
    custom: (body: any) => {
      if (typeof body.path === 'string' && (body.path.includes('\0') || /[\x00-\x1f]/.test(body.path))) {
        return 'Path contains illegal null bytes or control characters.';
      }
      return null;
    },
  },
  processExec: {
    required: ['command'],
    types: { command: 'string' },
    minLengths: { command: 1 },
    maxLengths: { command: 4000 },
  },
  planGoalSchema: {
    required: ['goal'],
    types: { goal: 'string' },
    minLengths: { goal: 1 },
  },
  debugErrorSchema: {
    required: ['errorLog'],
    types: { errorLog: 'string' },
    minLengths: { errorLog: 1 },
  },
  julesSession: {
    required: ['prompt', 'sourceContext'],
    types: { prompt: 'string', sourceContext: 'object' },
    minLengths: { prompt: 1 },
  },
};
