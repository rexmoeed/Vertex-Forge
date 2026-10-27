import React from 'react';
import { Sparkles } from 'lucide-react';

interface EditorEmptyStateProps {
  onFocus: () => void;
}

export const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({ onFocus }) => {
  return (
    <div
      onClick={onFocus}
      style={{
        backgroundColor: 'var(--ide-editor-bg)',
        color: 'var(--ide-text)',
      }}
      className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative"
    >
      <div
        style={{
          backgroundColor: 'var(--ide-surface-elevated)',
          borderColor: 'var(--ide-border)',
        }}
        className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs mb-3"
      >
        <Sparkles className="w-7 h-7 animate-pulse" style={{ color: 'var(--ide-accent)' }} />
      </div>
      <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ide-text)' }}>
        Vertex Forge Autonomous Studio
      </h2>
      <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--ide-text-muted)' }}>
        Select any file from the explorer on the left or use quick shortcuts below
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-5 max-w-md font-mono text-[11px]">
        <span
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="px-2.5 py-1 border rounded-lg shadow-xs"
        >
          <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘P</span> Quick Open
        </span>
        <span
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="px-2.5 py-1 border rounded-lg shadow-xs"
        >
          <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘K</span> Inline AI
        </span>
        <span
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="px-2.5 py-1 border rounded-lg shadow-xs"
        >
          <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘B</span> Toggle Sidebar
        </span>
        <span
          style={{
            backgroundColor: 'var(--ide-surface-elevated)',
            borderColor: 'var(--ide-border)',
            color: 'var(--ide-text)',
          }}
          className="px-2.5 py-1 border rounded-lg shadow-xs"
        >
          <span className="font-bold" style={{ color: 'var(--ide-accent)' }}>⌘`</span> Terminal Dock
        </span>
      </div>
    </div>
  );
};
