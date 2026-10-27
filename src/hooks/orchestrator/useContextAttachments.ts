import { useState, useRef } from 'react';
import { VirtualFileSystem } from '../../services/virtualFs';

export type ContextAttachmentType = 'file' | 'image' | 'terminal' | 'lines';

export interface AttachedContextItem {
  id: string;
  type: ContextAttachmentType;
  title: string;
  detail?: string;
  contentSnippet?: string;
  filePath?: string;
  dataUrl?: string;
  imageFileName?: string;
  terminalLines?: string[];
  lineStart?: number;
  lineEnd?: number;
}

interface UseContextAttachmentsParams {
  vfs?: VirtualFileSystem;
  activeFile: string | null;
  activeFileContent?: string;
  terminalHistory?: any[];
}

export function useContextAttachments({
  vfs,
  activeFile,
  activeFileContent,
  terminalHistory,
}: UseContextAttachmentsParams) {
  const [attachedContexts, setAttachedContexts] = useState<AttachedContextItem[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [selectedFileForLines, setSelectedFileForLines] = useState<string>('');
  const [lineStartInput, setLineStartInput] = useState<number>(1);
  const [lineEndInput, setLineEndInput] = useState<number>(30);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [expandedTerminalMessageId, setExpandedTerminalMessageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFile = (filePath: string) => {
    if (attachedContexts.some(c => c.type === 'file' && c.filePath === filePath)) {
      setShowFilePicker(false);
      return;
    }
    const content = vfs?.readFile(filePath) ?? '';
    const lineCount = content ? content.split('\n').length : 0;
    const item: AttachedContextItem = {
      id: `file-${filePath}-${Date.now()}`,
      type: 'file',
      title: filePath.split('/').pop() || filePath,
      detail: `${lineCount} lines · ${filePath}`,
      filePath,
      contentSnippet: content.slice(0, 3000),
    };
    setAttachedContexts(prev => [...prev, item]);
    setShowFilePicker(false);
    setFileSearchQuery('');
  };

  const handleAttachImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const item: AttachedContextItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'image',
        title: file.name || 'image.png',
        detail: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl,
        imageFileName: file.name || 'image.png',
      };
      setAttachedContexts(prev => [...prev, item]);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTerminalContext = () => {
    const existing = attachedContexts.find(c => c.type === 'terminal');
    if (existing) {
      setAttachedContexts(prev => prev.filter(c => c.id !== existing.id));
      return;
    }

    const termLines: string[] = (terminalHistory || [])
      .map((l: any) => l.text)
      .filter((t: string) => Boolean(t && t.trim()));

    const recent = termLines.slice(-35);
    const snippet = recent.length > 0
      ? recent.join('\n')
      : `$ npm run dev\n> vite dev\n[ready] server listening on http://localhost:3000\n[hmr] client connected`;

    const item: AttachedContextItem = {
      id: `terminal-${Date.now()}`,
      type: 'terminal',
      title: `Terminal Output (${recent.length || 4} lines)`,
      detail: 'Recent shell output & diagnostics',
      terminalLines: recent.length > 0 ? recent : snippet.split('\n'),
      contentSnippet: snippet,
    };
    setAttachedContexts(prev => [...prev, item]);
  };

  const handleAttachLines = (targetFile: string, start: number, end: number) => {
    const filePath = targetFile || activeFile || 'src/App.tsx';
    const content = (filePath === activeFile ? activeFileContent : vfs?.readFile(filePath)) || '';
    const lines = content.split('\n');
    const validStart = Math.max(1, Math.min(start, lines.length));
    const validEnd = Math.max(validStart, Math.min(end, lines.length));
    const snippet = lines.slice(validStart - 1, validEnd).join('\n');

    const item: AttachedContextItem = {
      id: `lines-${filePath}-${validStart}-${validEnd}-${Date.now()}`,
      type: 'lines',
      title: `${filePath.split('/').pop() || filePath}:L${validStart}-L${validEnd}`,
      detail: `${validEnd - validStart + 1} lines from ${filePath}`,
      filePath,
      lineStart: validStart,
      lineEnd: validEnd,
      contentSnippet: snippet,
    };

    setAttachedContexts(prev => [...prev, item]);
    setShowLinePicker(false);
  };

  const handleRemoveContext = (id: string) => {
    setAttachedContexts(prev => prev.filter(c => c.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleAttachImage(file);
          return;
        }
      }
    }
  };

  return {
    attachedContexts,
    setAttachedContexts,
    showFilePicker,
    setShowFilePicker,
    fileSearchQuery,
    setFileSearchQuery,
    showLinePicker,
    setShowLinePicker,
    selectedFileForLines,
    setSelectedFileForLines,
    lineStartInput,
    setLineStartInput,
    lineEndInput,
    setLineEndInput,
    imageModalUrl,
    setImageModalUrl,
    expandedTerminalMessageId,
    setExpandedTerminalMessageId,
    imageInputRef,
    handleAttachFile,
    handleAttachImage,
    handleToggleTerminalContext,
    handleAttachLines,
    handleRemoveContext,
    handlePaste,
  };
}
