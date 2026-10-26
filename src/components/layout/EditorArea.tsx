import React, { useEffect } from 'react';
import { useIDE } from '../../context/IDEContext';
import { useLayout } from '../../context/LayoutContext';
import { Splitter } from './Splitter';
import { SingleEditorGroup } from './editor/SingleEditorGroup';

export const EditorArea: React.FC = () => {
  const layout = useLayout();
  const { saveCurrentFile } = useIDE();

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const isSplit = layout.config.editorSplit !== 'none';
  const isVertical = layout.config.editorSplit === 'vertical';

  const handleResize = (delta: number) => {
    // Modify editorSplitRatio
    const container = document.getElementById('editor-split-container');
    if (!container) return;
    const totalSize = isVertical ? container.clientWidth : container.clientHeight;
    if (totalSize > 0) {
      const deltaRatio = delta / totalSize;
      layout.setEditorSplitRatio(layout.config.editorSplitRatio + deltaRatio);
    }
  };

  return (
    <div
      id="editor-split-container"
      className={`flex-1 flex min-w-0 overflow-hidden ${
        isVertical ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Primary Editor Group 0 */}
      <div
        style={{
          flex: isSplit ? `${layout.config.editorSplitRatio} 1 0%` : '1 1 0%',
        }}
        className="flex min-w-0 min-h-0 overflow-hidden"
      >
        <SingleEditorGroup
          groupId={0}
          isActive={layout.config.activeEditorGroupIndex === 0}
          onFocus={() => layout.setActiveEditorGroupIndex(0)}
          onSplitRight={() => layout.splitEditor('vertical')}
          onSplitDown={() => layout.splitEditor('horizontal')}
          onCloseSplit={() => layout.closeEditorSplit()}
          canCloseSplit={isSplit}
        />
      </div>

      {/* Splitter if split is enabled */}
      {isSplit && (
        <Splitter
          direction={isVertical ? 'vertical' : 'horizontal'}
          onResize={handleResize}
          label="Resize editor split"
        />
      )}

      {/* Secondary Editor Group 1 */}
      {isSplit && (
        <div
          style={{
            flex: `${1 - layout.config.editorSplitRatio} 1 0%`,
          }}
          className="flex min-w-0 min-h-0 overflow-hidden"
        >
          <SingleEditorGroup
            groupId={1}
            isActive={layout.config.activeEditorGroupIndex === 1}
            onFocus={() => layout.setActiveEditorGroupIndex(1)}
            onSplitRight={() => layout.splitEditor('vertical')}
            onSplitDown={() => layout.splitEditor('horizontal')}
            onCloseSplit={() => layout.closeEditorSplit()}
            canCloseSplit={true}
          />
        </div>
      )}
    </div>
  );
};

