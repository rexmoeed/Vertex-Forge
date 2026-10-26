import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export interface AiRouterContext {
  getAiClient: () => GoogleGenAI | null;
  setApiKey: (key: string) => void;
  getApiKey: () => string;
  getGenAIClient: (req?: Request) => GoogleGenAI | null;
}
