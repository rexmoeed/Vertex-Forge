import { describe, it, expect, vi } from 'vitest';
import { validateBody, CommonSchemas } from '../../../server/middleware/validation';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(body: any) {
  const req = { body } as Request;
  let responseStatus = 200;
  let responseJson: any = null;

  const res = {
    status: vi.fn((code: number) => {
      responseStatus = code;
      return res;
    }),
    json: vi.fn((data: any) => {
      responseJson = data;
      return res;
    }),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next, getStatus: () => responseStatus, getJson: () => responseJson };
}

describe('API Boundary Validation Middleware', () => {
  describe('General Payload Validation', () => {
    it('rejects null or non-object payloads with 400', () => {
      const middleware = validateBody(CommonSchemas.fsPath);
      const { req, res, next, getStatus, getJson } = createMockReqRes(null);

      middleware(req, res, next);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toContain('must be a JSON object');
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects missing required fields', () => {
      const middleware = validateBody({ required: ['targetPath'] });
      const { req, res, next, getStatus, getJson } = createMockReqRes({});

      middleware(req, res, next);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toContain("Missing required field 'targetPath'");
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects type mismatches', () => {
      const middleware = validateBody({ types: { port: 'number' } });
      const { req, res, next, getStatus, getJson } = createMockReqRes({ port: 'not-a-number' });

      middleware(req, res, next);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toContain("must be of type 'number'");
      expect(next).not.toHaveBeenCalled();
    });

    it('enforces min and max length constraints on strings', () => {
      const middleware = validateBody({
        minLengths: { name: 3 },
        maxLengths: { name: 8 },
      });

      // Too short
      const short = createMockReqRes({ name: 'ab' });
      middleware(short.req, short.res, short.next);
      expect(short.getStatus()).toBe(400);
      expect(short.getJson().error).toContain('at least 3 characters');

      // Too long
      const long = createMockReqRes({ name: 'more-than-eight-chars' });
      middleware(long.req, long.res, long.next);
      expect(long.getStatus()).toBe(400);
      expect(long.getJson().error).toContain('exceeds maximum length of 8');

      // Valid length
      const valid = createMockReqRes({ name: 'valid' });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });

    it('enforces regex patterns', () => {
      const middleware = validateBody({
        patterns: { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      });

      const invalid = createMockReqRes({ email: 'bad-email' });
      middleware(invalid.req, invalid.res, invalid.next);
      expect(invalid.getStatus()).toBe(400);
      expect(invalid.getJson().error).toContain('does not match expected format');

      const valid = createMockReqRes({ email: 'dev@vertexforge.io' });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });
  });

  describe('Common Domain Schemas', () => {
    it('CommonSchemas.aiChat validates message arrays', () => {
      const middleware = validateBody(CommonSchemas.aiChat);

      const empty = createMockReqRes({ messages: [] });
      middleware(empty.req, empty.res, empty.next);
      expect(empty.getStatus()).toBe(400);
      expect(empty.getJson().error).toContain('Messages array cannot be empty');

      const valid = createMockReqRes({ messages: [{ role: 'user', content: 'hello' }] });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });

    it('CommonSchemas.fsPath prevents illegal null byte path injection', () => {
      const middleware = validateBody(CommonSchemas.fsPath);

      const injected = createMockReqRes({ path: '/etc/passwd\0.txt' });
      middleware(injected.req, injected.res, injected.next);
      expect(injected.getStatus()).toBe(400);
      expect(injected.getJson().error).toContain('illegal null bytes');

      const valid = createMockReqRes({ path: 'src/components/Editor.tsx' });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });

    it('CommonSchemas.processExec validates command parameter length and presence', () => {
      const middleware = validateBody(CommonSchemas.processExec);

      const missing = createMockReqRes({});
      middleware(missing.req, missing.res, missing.next);
      expect(missing.getStatus()).toBe(400);

      const valid = createMockReqRes({ command: 'npm run test' });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });

    it('CommonSchemas.julesSession ensures prompt and sourceContext structure', () => {
      const middleware = validateBody(CommonSchemas.julesSession);

      const invalid = createMockReqRes({ prompt: 'Implement auth', sourceContext: 'not-an-object' });
      middleware(invalid.req, invalid.res, invalid.next);
      expect(invalid.getStatus()).toBe(400);

      const valid = createMockReqRes({
        prompt: 'Implement auth',
        sourceContext: { repository: 'rexmoeed/Vertex-Forge', branch: 'main' },
      });
      middleware(valid.req, valid.res, valid.next);
      expect(valid.next).toHaveBeenCalled();
    });
  });
});
