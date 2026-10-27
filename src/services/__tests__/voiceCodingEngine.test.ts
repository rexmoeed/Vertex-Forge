import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceCodingEngine } from '../voiceCodingEngine';
import { VirtualFileSystem } from '../virtualFs';
import { speechRecognitionService } from '../speechRecognitionService';

vi.mock('../speechRecognitionService', () => ({
  speechRecognitionService: {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue({
      id: 'mock-vt-0',
      text: 'build new user profile component',
      confidence: 0.95,
      startedAt: Date.now(),
      completedAt: Date.now(),
      segments: [],
    }),
    cancel: vi.fn().mockResolvedValue(undefined),
    speak: vi.fn().mockResolvedValue(undefined),
  },
  BrowserSpeechRecognitionService: vi.fn(),
}));

vi.mock('../desktopBridge', () => ({
  DesktopBridge: {
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, stdout: 'ok', stderr: '' }),
    writeFile: vi.fn().mockResolvedValue(true),
  },
}));

describe('VoiceCodingEngine', () => {
  let engine: VoiceCodingEngine;
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    vfs = new VirtualFileSystem([
      {
        id: 'node-1',
        name: 'App.tsx',
        path: 'src/App.tsx',
        type: 'file',
        content: 'export const App = () => <div>App</div>;',
      },
    ]);
    engine = new VoiceCodingEngine(vfs);
  });

  it('starts listening and updates state', async () => {
    const listener = vi.fn();
    engine.setListener(listener);

    await engine.startListening();
    expect(speechRecognitionService.start).toHaveBeenCalledWith({ continuous: true, interimResults: true });
    expect(listener).toHaveBeenCalledWith('listening', undefined);
  });

  it('handles empty transcript gracefully', async () => {
    vi.mocked(speechRecognitionService.stop).mockResolvedValueOnce({
      id: 'mock-vt-empty',
      text: '',
      confidence: 0,
      startedAt: Date.now(),
      completedAt: Date.now(),
      segments: [],
    });

    const session = await engine.stopAndProcess();
    expect(session.state).toBe('completed');
    expect(session.spokenResponse).toContain("didn't hear a command");
  });

  it('processes and executes a voice coding command', async () => {
    vi.mocked(speechRecognitionService.stop).mockResolvedValueOnce({
      id: 'mock-vt-1',
      text: 'modify App.tsx to add dark mode toggle',
      confidence: 0.98,
      startedAt: Date.now(),
      completedAt: Date.now(),
      segments: [],
    });

    const session = await engine.stopAndProcess();
    expect(session.state).toBe('completed');
    expect(session.plan).toBeDefined();
    expect(session.plan?.targetFiles).toContain('src/App.tsx');
    expect(session.lastExecutionResults?.filesChanged).toContain('src/App.tsx');
    expect(speechRecognitionService.speak).toHaveBeenCalled();
  });

  it('pauses for confirmation on destructive voice commands', async () => {
    vi.mocked(speechRecognitionService.stop).mockResolvedValueOnce({
      id: 'mock-vt-2',
      text: 'delete all files and reset git',
      confidence: 0.95,
      startedAt: Date.now(),
      completedAt: Date.now(),
      segments: [],
    });

    const session = await engine.stopAndProcess();
    expect(session.plan?.requiresConfirmation).toBe(true);
    expect(session.plan?.estimatedRisk).toBe('destructive');
    expect(session.spokenResponse).toContain('Caution: this command may perform destructive operations');
  });

  it('cancels active voice session and resets state', async () => {
    await engine.startListening();
    await engine.cancel();

    expect(speechRecognitionService.cancel).toHaveBeenCalled();
    expect(engine.getSession()).toBeNull();
  });
});
