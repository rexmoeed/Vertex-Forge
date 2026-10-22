import { z } from 'zod';

export const ServerEnvSchema = z.object({
  PORT: z.string().regex(/^\d+$/).default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DISABLE_HMR: z.string().optional(),
  VITE_API_URL: z.string().url().optional().or(z.string().length(0)),
  VITE_DEV_SERVER_URL: z.string().url().optional().or(z.string().length(0)),
  APP_URL: z.string().url().optional().or(z.string().length(0)),
  API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  JULES_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function validateServerEnvironment(env: Record<string, string | undefined>): ServerEnv {
  const result = ServerEnvSchema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`[VertexForge:Config] Server environment configuration invalid: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}
