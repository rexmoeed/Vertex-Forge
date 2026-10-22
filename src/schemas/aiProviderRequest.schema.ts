import { z } from 'zod';

export const AIPlanRequestSchema = z.object({
  goal: z.string().min(1, 'Goal cannot be empty'),
  currentStack: z.string().optional(),
  filesSummary: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

export type AIPlanRequest = z.infer<typeof AIPlanRequestSchema>;

export const AICodeRequestSchema = z.object({
  taskTitle: z.string().min(1, 'Task title cannot be empty'),
  taskDetails: z.string().optional(),
  filePath: z.string().min(1, 'File path cannot be empty'),
  currentCode: z.string().optional(),
  projectContext: z.string().optional(),
  agentRole: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

export type AICodeRequest = z.infer<typeof AICodeRequestSchema>;

export const AIChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).min(1, 'At least one chat message is required'),
  activeFile: z.string().optional(),
  fileContent: z.string().optional(),
  projectSummary: z.string().optional(),
  agentRole: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  images: z.array(
    z.union([
      z.string(),
      z.object({
        data: z.string(),
        mimeType: z.string(),
      }),
    ])
  ).optional(),
});

export type AIChatRequest = z.infer<typeof AIChatRequestSchema>;

export const AISaveApiKeySchema = z.string().min(1, 'API key cannot be empty');
