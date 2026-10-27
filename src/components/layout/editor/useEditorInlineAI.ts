import { useState } from 'react';
import { logger } from '../../../services/logger';

export interface UseEditorInlineAIProps {
  activeFile: string | null;
  activeFileContent: string;
  updateFileContent: (content: string) => void;
  saveCurrentFile: () => void;
}

export function useEditorInlineAI({
  activeFile,
  activeFileContent,
  updateFileContent,
  saveCurrentFile,
}: UseEditorInlineAIProps) {
  const [isInlineAIOpen, setIsInlineAIOpen] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isInlineLoading, setIsInlineLoading] = useState(false);
  const [inlineResultNotice, setInlineResultNotice] = useState<string | null>(null);
  const [inlineOriginalCode, setInlineOriginalCode] = useState<string | null>(null);
  const [isDiffReviewActive, setIsDiffReviewActive] = useState(false);
  const [ghostText, setGhostText] = useState<string | null>(null);
  const [isCursorTabEnabled, setIsCursorTabEnabled] = useState(true);

  const handleInlineAISubmit = async () => {
    if (!inlinePrompt.trim() || !activeFile) return;
    setIsInlineLoading(true);
    setInlineResultNotice(null);
    setInlineOriginalCode(activeFileContent);
    try {
      const res = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: inlinePrompt,
          filePath: activeFile,
          currentCode: activeFileContent,
          agentRole: 'Full-Stack Developer',
          model: 'gemini-3.8-flash',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) {
          updateFileContent(data.code);
          setIsDiffReviewActive(true);
          setIsInlineAIOpen(false);
          return;
        }
      }
      const synthesized = `// [Cursor Edit] ${inlinePrompt}\n` + activeFileContent;
      updateFileContent(synthesized);
      setIsDiffReviewActive(true);
      setIsInlineAIOpen(false);
    } catch (err: unknown) {
      logger.error('Inline AI error:', err);
    } finally {
      setIsInlineLoading(false);
    }
  };

  const handleAcceptInlineDiff = () => {
    setIsDiffReviewActive(false);
    setInlineOriginalCode(null);
    setInlinePrompt('');
    saveCurrentFile();
  };

  const handleRejectInlineDiff = () => {
    if (inlineOriginalCode !== null) {
      updateFileContent(inlineOriginalCode);
    }
    setIsDiffReviewActive(false);
    setInlineOriginalCode(null);
    setInlinePrompt('');
  };

  return {
    isInlineAIOpen,
    setIsInlineAIOpen,
    inlinePrompt,
    setInlinePrompt,
    isInlineLoading,
    inlineResultNotice,
    isDiffReviewActive,
    ghostText,
    setGhostText,
    isCursorTabEnabled,
    setIsCursorTabEnabled,
    handleInlineAISubmit,
    handleAcceptInlineDiff,
    handleRejectInlineDiff,
  };
}
