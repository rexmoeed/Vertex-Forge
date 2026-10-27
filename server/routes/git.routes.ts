import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createGitStatusRouter } from './git/git.status.routes';
import { createGitBranchRouter } from './git/git.branch.routes';
import { createGitMutationRouter } from './git/git.mutation.routes';
import { createGitRemoteRouter } from './git/git.remote.routes';

/**
 * Modular Git API Router
 * Aggregates focused domain routers for status, branches, mutations, and remotes.
 */
export function createGitRouter(getAiClient: () => GoogleGenAI | null): Router {
  const router = Router();

  router.use(createGitStatusRouter());
  router.use(createGitBranchRouter());
  router.use(createGitMutationRouter());
  router.use(createGitRemoteRouter(getAiClient));

  return router;
}

export * from './git/git.utils';
