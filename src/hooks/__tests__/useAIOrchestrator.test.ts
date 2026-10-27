import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIOrchestrator } from '../useAIOrchestrator';

// Mock IDEContext
vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    activeAgent: 'Developer',
    activeFile: 'src/main.ts',
    activeFileContent: 'console.log("hello");',
    activeProject: { name: 'TestProject', path: '/test' },
    cursorMode: 'chat',
    setCursorMode: vi.fn(),
    proposeMultiFileChanges: vi.fn(),
    vfs: {
      readFile: vi.fn((path: string) => `// Content of ${path}`),
    },
    projectProfile: undefined,
    startAutonomousPlan: vi.fn(),
    terminalHistory: [{ text: '$ npm test\nPassed' }],
    taskPlan: [],
    currentTaskIndex: 0,
  }),
}));

// Mock CodebaseIntelligenceEngine
vi.mock('../../services/codebaseIntelligence', () => ({
  CodebaseIntelligenceEngine: {
    loadProjectMemory: vi.fn(() => []),
    addMemoryEntry: vi.fn((_key, entry) => ({ id: 'mem-1', ...entry })),
    performInvestigation: vi.fn(() => ({
      intent: 'general_query',
      relevanceScore: 0.9,
      dataFlow: undefined,
    })),
  },
}));

// Mock AIProviderService
vi.mock('../../services/aiProviderService', () => ({
  AIProviderService: {
    loadProviders: vi.fn(() => [{ id: 'gemini', name: 'Google Gemini', isAvailable: true }]),
    sendPrompt: vi.fn(async () => ({ text: 'Mock AI response' })),
    recordUsage: vi.fn(),
  },
}));

// Mock GeminiService
vi.mock('../../services/geminiService', () => ({
  GeminiService: {
    chat: vi.fn(async () => ({ reply: 'Mock Gemini reply', agent: 'Developer' })),
  },
}));

describe('useAIOrchestrator hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAIOrchestrator());

    expect(result.current.selectedModel).toBe('gemini-3.8-flash');
    expect(result.current.selectedProvider).toBe('gemini');
    expect(result.current.chatMessages).toEqual([]);
    expect(result.current.attachedContexts).toEqual([]);
  });

  it('attaches and removes file contexts', () => {
    const { result } = renderHook(() => useAIOrchestrator());

    act(() => {
      result.current.handleAttachFile('src/utils/math.ts');
    });

    expect(result.current.attachedContexts.length).toBe(1);
    expect(result.current.attachedContexts[0].title).toBe('math.ts');
    expect(result.current.attachedContexts[0].type).toBe('file');

    act(() => {
      result.current.handleRemoveContext(result.current.attachedContexts[0].id);
    });

    expect(result.current.attachedContexts.length).toBe(0);
  });

  it('queues messages when chat is loading and allows clearing conversation', () => {
    const { result } = renderHook(() => useAIOrchestrator());

    act(() => {
      result.current.setChatInput('First prompt');
    });
    expect(result.current.chatInput).toBe('First prompt');

    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.chatMessages).toEqual([]);
    expect(result.current.attachedContexts).toEqual([]);
  });
});
