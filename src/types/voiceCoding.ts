/**
 * Voice Coding typed contracts for Vertex Forge
 */

export type SpeechRecognitionState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'planning'
  | 'executing'
  | 'testing'
  | 'completed'
  | 'failed';

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface VoiceTranscriptSegment {
  text: string;
  confidence: number;
  timestamp: number;
  isFinal: boolean;
}

export interface VoiceTranscript {
  id: string;
  text: string;
  language?: string;
  startedAt: number;
  completedAt: number;
  confidence?: number;
  segments: VoiceTranscriptSegment[];
}

export interface SpeechRecognitionService {
  start(options?: SpeechRecognitionOptions): Promise<void>;
  stop(): Promise<VoiceTranscript>;
  cancel(): Promise<void>;
  getState(): SpeechRecognitionState;
  onPartialTranscript(callback: (text: string) => void): () => void;
  onFinalTranscript(callback: (text: string) => void): () => void;
  onError?(callback: (error: string) => void): () => void;
}

export interface VoiceCodingPlanStep {
  id: string;
  description: string;
  tool?: string;
  targetFile?: string;
  isDestructive: boolean;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  result?: string;
}

export interface VoiceCodingExecutionPlan {
  id: string;
  summary: string;
  intent: string;
  targetFiles: string[];
  steps: VoiceCodingPlanStep[];
  requiresConfirmation: boolean;
  estimatedRisk: 'safe' | 'moderate' | 'destructive';
}

export interface VoiceCodingSession {
  id: string;
  transcript: VoiceTranscript;
  state: SpeechRecognitionState;
  plan?: VoiceCodingExecutionPlan;
  spokenResponse?: string;
  error?: string;
  lastExecutionResults?: {
    filesChanged: string[];
    terminalCommands: string[];
    testsPassed: boolean;
  };
}
