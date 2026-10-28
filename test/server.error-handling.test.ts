import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app';

describe('Server Structured Error Tracking & Health Endpoint', () => {
  const { app } = createApp();

  it('returns 200 with structured health metadata and error-tracking status on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Vertex Forge Backend API');
    expect(res.body.uptime).toBeTypeOf('number');
    expect(res.body.errorTracking).toBeDefined();
    expect(res.body.errorTracking.provider).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('captures unhandled server exceptions, logging structured errors and returning 500 JSON with requestId', async () => {
    const customReqId = 'trace-client-req-12345';
    const res = await request(app)
      .get('/api/simulate-error')
      .set('x-request-id', customReqId);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toContain('Simulated unhandled server exception');
    expect(res.body.requestId).toBe(customReqId);
    expect(res.body.path).toBe('/api/simulate-error');
    expect(res.body.timestamp).toBeDefined();
  });

  it('auto-generates a structured requestId header and payload when client omits one', async () => {
    const res = await request(app).get('/api/simulate-error');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.requestId).toMatch(/^req_/);
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});
