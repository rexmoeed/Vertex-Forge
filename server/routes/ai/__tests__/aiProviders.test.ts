import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAiRouter } from '../index';

describe('Modular AI Routes (per-provider handlers)', () => {
  const getAiClient = vi.fn().mockReturnValue(null);
  const setApiKey = vi.fn();
  const getApiKey = vi.fn().mockReturnValue('');

  const app = express();
  app.use(express.json());
  app.use(createAiRouter(getAiClient, setApiKey, getApiKey));

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.JULES_API_KEY;
  });

  it('handles /api/ai/config successfully', async () => {
    const res = await request(app)
      .post('/api/ai/config')
      .send({ apiKey: 'test-gemini-key' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(setApiKey).toHaveBeenCalledWith('test-gemini-key');
  });

  it('returns appropriate error when testing gemini without key', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/ai/provider/test')
      .send({ providerId: 'gemini', apiKey: '' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No Google Gemini API key');
  });

  it('returns appropriate error when testing anthropic without key', async () => {
    const res = await request(app)
      .post('/api/ai/provider/test')
      .send({ providerId: 'anthropic', apiKey: '' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Anthropic API key required');
  });

  it('lists provider models cleanly', async () => {
    const res = await request(app)
      .get('/api/ai/provider/models?providerId=gemini');

    expect(res.status).toBe(200);
    expect(res.body.models).toBeDefined();
    expect(res.body.models.length).toBeGreaterThan(0);
  });

  it('generates heuristic plan in offline resilient mode', async () => {
    const res = await request(app)
      .post('/api/ai/plan')
      .send({ goal: 'Add unit tests for AI routes' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.steps).toBeDefined();
  });
});
