import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  AIPlanRequestSchema,
  AICodeRequestSchema,
  AIChatRequestSchema,
  AISaveApiKeySchema,
} from '../aiProviderRequest.schema';
import {
  GitHubRepoParamsSchema,
  GitHubPullRequestParamsSchema,
  GitHubCreatePRSchema,
  GitCommitParamsSchema,
} from '../gitHubIntegration.schema';
import { ServerEnvSchema, validateServerEnvironment } from '../server.schema';
import { GitWorkflowService } from '../../services/gitWorkflowService';

describe('Service Entry Boundary Validation Schemas', () => {
  describe('AI Provider Request Schemas', () => {
    it('validates AI plan request and rejects empty goals', () => {
      const valid = AIPlanRequestSchema.parse({ goal: 'Build an IDE' });
      expect(valid.goal).toBe('Build an IDE');

      expect(() => AIPlanRequestSchema.parse({ goal: '' })).toThrow(ZodError);
    });

    it('validates AI code request and rejects missing required fields', () => {
      const valid = AICodeRequestSchema.parse({
        taskTitle: 'Refactor Menu',
        filePath: 'src/components/Menu.tsx',
      });
      expect(valid.taskTitle).toBe('Refactor Menu');

      expect(() => AICodeRequestSchema.parse({ taskTitle: '', filePath: 'test.ts' })).toThrow(ZodError);
      expect(() => AICodeRequestSchema.parse({ taskTitle: 'Test', filePath: '' })).toThrow(ZodError);
    });

    it('validates AI chat request and rejects empty message histories', () => {
      const valid = AIChatRequestSchema.parse({
        messages: [{ role: 'user', content: 'Hello assistant' }],
      });
      expect(valid.messages).toHaveLength(1);

      expect(() => AIChatRequestSchema.parse({ messages: [] })).toThrow(ZodError);
    });

    it('validates AI API key string schema', () => {
      expect(AISaveApiKeySchema.parse('sk-valid-key')).toBe('sk-valid-key');
      expect(() => AISaveApiKeySchema.parse('')).toThrow(ZodError);
    });
  });

  describe('GitHub Integration Schemas', () => {
    it('validates repository coordinates', () => {
      const valid = GitHubRepoParamsSchema.parse({ owner: 'rexmoeed', repo: 'Vertex-Forge' });
      expect(valid.owner).toBe('rexmoeed');
      expect(valid.repo).toBe('Vertex-Forge');

      expect(() => GitHubRepoParamsSchema.parse({ owner: '', repo: 'repo' })).toThrow(ZodError);
      expect(() => GitHubRepoParamsSchema.parse({ owner: 'owner', repo: '' })).toThrow(ZodError);
    });

    it('validates pull request listing query parameters', () => {
      const valid = GitHubPullRequestParamsSchema.parse({
        owner: 'rexmoeed',
        repo: 'Vertex-Forge',
        state: 'closed',
      });
      expect(valid.state).toBe('closed');

      expect(() =>
        GitHubPullRequestParamsSchema.parse({
          owner: 'rexmoeed',
          repo: 'Vertex-Forge',
          state: 'invalid_state' as any,
        })
      ).toThrow(ZodError);
    });

    it('validates pull request creation payloads', () => {
      const valid = GitHubCreatePRSchema.parse({
        owner: 'rexmoeed',
        repo: 'Vertex-Forge',
        title: 'Feature: Add Git tabs',
        head: 'feature/tabs',
        base: 'main',
      });
      expect(valid.title).toBe('Feature: Add Git tabs');

      expect(() =>
        GitHubCreatePRSchema.parse({
          owner: 'rexmoeed',
          repo: 'Vertex-Forge',
          title: '',
          head: 'head',
          base: 'base',
        })
      ).toThrow(ZodError);
    });

    it('validates git commit parameters and rejects empty messages in service entry', async () => {
      expect(() => GitCommitParamsSchema.parse({ message: '' })).toThrow(ZodError);
      await expect(GitWorkflowService.commit('')).rejects.toThrow(ZodError);
    });
  });

  describe('Server Environment Schema', () => {
    it('parses valid environment configurations with defaults', () => {
      const env = validateServerEnvironment({
        PORT: '4000',
        NODE_ENV: 'production',
      });
      expect(env.PORT).toBe(4000);
      expect(env.NODE_ENV).toBe('production');
    });

    it('rejects non-numeric PORT values', () => {
      expect(() =>
        validateServerEnvironment({
          PORT: 'invalid_port',
        })
      ).toThrow(/Server environment configuration invalid/);
    });
  });
});
