import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatStreamView } from '../layout/orchestrator/ChatStreamView';
import type { OrchestratorMessage } from '../layout/orchestrator/ChatStreamView';

describe('ChatStreamView Component', () => {
  const mockMessages: OrchestratorMessage[] = [
    { role: 'user', content: 'Can you analyze the project architecture?' },
    { role: 'assistant', content: 'Architecture analysis complete: Clean modular separation.' },
  ];

  it('renders chat message stream and user content', () => {
    const dummyRef = { current: null };
    render(
      <ChatStreamView
        chatMessages={mockMessages}
        isReasoningOpen={false}
        setIsReasoningOpen={vi.fn()}
        queuedMessages={[]}
        handleSendQueuedMessage={vi.fn()}
        handleEditQueuedMessage={vi.fn()}
        handleDeleteQueuedMessage={vi.fn()}
        isChatLoading={false}
        chatBottomRef={dummyRef}
        openFile={vi.fn()}
        setImageModalUrl={vi.fn()}
      />
    );

    expect(screen.getByText('Can you analyze the project architecture?')).toBeDefined();
    expect(screen.getByText('Architecture analysis complete: Clean modular separation.')).toBeDefined();
  });

  it('renders queued messages and handles deletion', () => {
    const dummyRef = { current: null };
    const onDelete = vi.fn();
    render(
      <ChatStreamView
        chatMessages={[]}
        isReasoningOpen={false}
        setIsReasoningOpen={vi.fn()}
        queuedMessages={[{ id: 'q-1', text: 'Follow-up question about tests', timestamp: Date.now() }]}
        handleSendQueuedMessage={vi.fn()}
        handleEditQueuedMessage={vi.fn()}
        handleDeleteQueuedMessage={onDelete}
        isChatLoading={false}
        chatBottomRef={dummyRef}
        openFile={vi.fn()}
        setImageModalUrl={vi.fn()}
      />
    );

    expect(screen.getByText('Follow-up question about tests')).toBeDefined();
    const deleteBtn = screen.getByTitle('Delete from Queue');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('q-1');
  });
});
