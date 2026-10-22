import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChatComposerCard } from '../layout/orchestrator/ChatComposerCard';

afterEach(cleanup);

describe('ChatComposerCard Component', () => {
  const defaultProps = {
    chatInput: '',
    setChatInput: vi.fn(),
    textareaRef: { current: null },
    attachedContexts: [],
    setAttachedContexts: vi.fn(),
    handleRemoveContext: vi.fn(),
    handleAttachImage: vi.fn(),
    handlePaste: vi.fn(),
    handleSendQuery: vi.fn(),
    cursorMode: 'agent' as const,
    setCursorMode: vi.fn(),
    selectedModel: 'gemini-1.5-pro',
    setSelectedModel: vi.fn(),
    isModelDropdownOpen: false,
    setIsModelDropdownOpen: vi.fn(),
    setActiveView: vi.fn(),
    setIsVoiceModalOpen: vi.fn(),
    isChatLoading: false,
    setIsChatLoading: vi.fn(),
    activeFile: 'src/App.tsx',
    handleAttachFile: vi.fn(),
    handleToggleTerminalContext: vi.fn(),
    setSelectedFileForLines: vi.fn(),
    setShowLinePicker: vi.fn(),
    setShowFilePicker: vi.fn(),
    imageInputRef: { current: null },
  };

  it('renders the composer textarea with proper placeholder', () => {
    render(<ChatComposerCard {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Plan, Build, \/ for skills, @ for context/i);
    expect(textarea).toBeDefined();
  });

  it('calls setChatInput when typing into the textarea', () => {
    const setChatInput = vi.fn();
    render(<ChatComposerCard {...defaultProps} setChatInput={setChatInput} />);
    const textarea = screen.getByPlaceholderText(/Plan, Build, \/ for skills, @ for context/i);
    fireEvent.change(textarea, { target: { value: 'Fix bug in auth' } });
    expect(setChatInput).toHaveBeenCalledWith('Fix bug in auth');
  });

  it('renders attached context chips and triggers remove when close button is clicked', () => {
    const handleRemoveContext = vi.fn();
    const attachedContexts = [
      { id: 'ctx-1', type: 'file' as const, title: 'server.ts' },
      { id: 'ctx-2', type: 'terminal' as const, title: 'Terminal output' },
    ];
    render(
      <ChatComposerCard
        {...defaultProps}
        attachedContexts={attachedContexts}
        handleRemoveContext={handleRemoveContext}
      />
    );

    expect(screen.getByText('server.ts')).toBeDefined();
    expect(screen.getByText('Terminal output')).toBeDefined();

    const removeButtons = screen.getAllByTitle('Remove context item');
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]);
    expect(handleRemoveContext).toHaveBeenCalledWith('ctx-1');
  });

  it('triggers handleSendQuery on Enter key press without shift', () => {
    const handleSendQuery = vi.fn();
    render(
      <ChatComposerCard
        {...defaultProps}
        chatInput="Refactor database schema"
        handleSendQuery={handleSendQuery}
      />
    );

    const textarea = screen.getByPlaceholderText(/Plan, Build, \/ for skills, @ for context/i);
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(handleSendQuery).toHaveBeenCalledTimes(1);
  });
});
