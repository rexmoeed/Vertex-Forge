import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';

describe('Backend AI Express Routes API Contract', () => {
  const { app } = createApp();

  it('GET /api/health returns 200 with service metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('Vertex Forge');
    expect(res.body.version).toBe('1.0.0');
  });

  it('POST /api/ai/config stores API key in session', async () => {
    const res = await request(app)
      .post('/api/ai/config')
      .send({ apiKey: 'test-session-key-xyz' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hasApiKey).toBe(true);
  });

  it('POST /api/ai/plan returns fallback or generated plan shape on request', async () => {
    const res = await request(app)
      .post('/api/ai/plan')
      .send({
        goal: 'Add unit tests for shopping cart checkout',
        currentStack: 'React + TypeScript',
        filesSummary: 'src/App.tsx, src/cart.ts',
      });

    expect(res.status).toBe(200);
    expect(res.body.tasks).toBeDefined();
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
    expect(res.body.interpretation).toBeDefined();
  });

  it('POST /api/ai/debug returns root-cause analysis structure', async () => {
    const res = await request(app)
      .post('/api/ai/debug')
      .send({
        errorLog: 'TypeError: Cannot read properties of undefined (reading map)',
        failingFile: 'src/components/TaskList.tsx',
        fileContent: 'export const TaskList = (props) => props.items.map(i => i.name);',
      });

    expect(res.status).toBe(200);
    expect(res.body.rootCause).toBeDefined();
  });
});
