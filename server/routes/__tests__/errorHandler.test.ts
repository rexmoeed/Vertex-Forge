import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import {
  ValidationError,
  NotFoundError,
  UpstreamApiError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../errors';

describe('Global ErrorHandler Middleware & AppError Classes', () => {
  const app = express();
  app.use(express.json());

  // Test routes throwing various AppError subclasses
  app.get('/test/validation-error', () => {
    throw new ValidationError('Invalid request payload', { field: 'email', reason: 'malformed' });
  });

  app.get('/test/not-found', () => {
    throw new NotFoundError('Agent lead not found');
  });

  app.get('/test/upstream-error', () => {
    throw new UpstreamApiError('Anthropic API', 'Connection timeout');
  });

  app.get('/test/unauthorized', () => {
    throw new UnauthorizedError('Invalid bearer token');
  });

  app.get('/test/forbidden', () => {
    throw new ForbiddenError('Insufficient workspace privileges');
  });

  app.get('/test/conflict', () => {
    throw new ConflictError('Workspace lock already held');
  });

  app.get('/test/generic-error', () => {
    throw new Error('Unexpected database disconnection');
  });

  // Attach error handler
  app.use(errorHandler);

  it('handles ValidationError with 400 and VALIDATION_ERROR code', async () => {
    const res = await request(app).get('/test/validation-error');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid request payload');
    expect(res.body.error.details).toEqual({ field: 'email', reason: 'malformed' });
    expect(res.body.path).toBe('/test/validation-error');
  });

  it('handles NotFoundError with 404 and NOT_FOUND code', async () => {
    const res = await request(app).get('/test/not-found');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('Agent lead not found');
  });

  it('handles UpstreamApiError with 502 and UPSTREAM_API_ERROR code', async () => {
    const res = await request(app).get('/test/upstream-error');
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UPSTREAM_API_ERROR');
    expect(res.body.error.message).toContain('Anthropic API');
  });

  it('handles UnauthorizedError with 401 and UNAUTHORIZED code', async () => {
    const res = await request(app).get('/test/unauthorized');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('handles ForbiddenError with 403 and FORBIDDEN code', async () => {
    const res = await request(app).get('/test/forbidden');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('handles ConflictError with 409 and CONFLICT code', async () => {
    const res = await request(app).get('/test/conflict');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('handles generic Error with 500 and INTERNAL_SERVER_ERROR code', async () => {
    const res = await request(app).get('/test/generic-error');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toBe('Unexpected database disconnection');
  });
});
