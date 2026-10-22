import { z } from 'zod';

export const GitHubRepoParamsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
});

export type GitHubRepoParams = z.infer<typeof GitHubRepoParamsSchema>;

export const GitHubPullRequestParamsSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  state: z.enum(['open', 'closed', 'all']).default('open'),
});

export type GitHubPullRequestParams = z.infer<typeof GitHubPullRequestParamsSchema>;

export const GitHubCreatePRSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  title: z.string().min(1, 'PR title cannot be empty'),
  head: z.string().min(1, 'Head branch cannot be empty'),
  base: z.string().min(1, 'Base branch cannot be empty'),
  body: z.string().optional(),
});

export type GitHubCreatePR = z.infer<typeof GitHubCreatePRSchema>;

export const GitCommitParamsSchema = z.object({
  message: z.string().min(1, 'Commit message cannot be empty'),
  amend: z.boolean().optional().default(false),
  cwd: z.string().optional(),
});

export type GitCommitParams = z.infer<typeof GitCommitParamsSchema>;
