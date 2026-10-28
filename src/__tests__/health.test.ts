import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/app';

describe('Healthcheck Endpoint (/api/health)', () => {
  const { app } = createApp();

  it('asserts GET /api/health returns 200 and a status field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeTypeOf('number');
    expect(res.body.service).toBeDefined();
  });
});
