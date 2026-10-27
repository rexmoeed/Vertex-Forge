import React from 'react';

interface EditorMinimapProps {
  lines: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const EditorMinimap: React.FC<EditorMinimapProps> = ({ lines, textareaRef }) => {
  return (
    <div
      onClick={(e) => {
        if (!textareaRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickRatio = (e.clientY - rect.top) / rect.height;
        textareaRef.current.scrollTop = clickRatio * textareaRef.current.scrollHeight;
      }}
      className="w-14 h-full border-l border-slate-850 bg-black/40 select-none overflow-hidden relative cursor-pointer hidden md:flex flex-col py-2 px-1 gap-[2px] opacity-75 hover:opacity-100 transition-opacity shrink-0"
      title="Code Minimap (Click to navigate)"
    >
      {lines.slice(0, 100).map((l: string, idx: number) => {
        const trimmed = l.trim();
        const width = Math.min(100, Math.max(15, trimmed.length * 3));
        const isKeyword = /^(export|import|const|function|interface|type|class|return)\b/.test(trimmed);
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');
        return (
          <div
            key={idx}
            className="h-[2px] rounded-xs"
            style={{
              width: `${width}%`,
              marginLeft: `${Math.min(20, (l.length - trimmed.length) * 2)}px`,
              backgroundColor: isKeyword
                ? '#00ff88'
                : isComment
                ? '#555555'
                : '#888888',
              opacity: trimmed ? 0.75 : 0,
            }}
          />
        );
      })}

      {/* Draggable Viewport Box */}
      <div
        className="absolute left-0 right-0 border border-white/25 bg-white/5 pointer-events-none rounded-xs"
        style={{
          top: `${Math.min(80, textareaRef.current ? (textareaRef.current.scrollTop / (textareaRef.current.scrollHeight || 1)) * 100 : 0)}%`,
          height: '32px',
        }}
      />
    </div>
  );
};
