import { useState, useMemo } from 'react';

export function useEditorFindReplace(
  activeFileContent: string,
  updateFileContent: (newContent: string) => void
) {
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findMatchIndex, setFindMatchIndex] = useState(0);

  const findMatches = useMemo(() => {
    if (!findText || !activeFileContent) return [];
    const results: number[] = [];
    let idx = 0;
    const lowerContent = activeFileContent.toLowerCase();
    const lowerFind = findText.toLowerCase();
    while ((idx = lowerContent.indexOf(lowerFind, idx)) !== -1) {
      results.push(idx);
      idx += lowerFind.length;
    }
    return results;
  }, [findText, activeFileContent]);

  const handleNextMatch = () => {
    if (findMatches.length === 0) return;
    setFindMatchIndex(prev => (prev + 1) % findMatches.length);
  };

  const handlePrevMatch = () => {
    if (findMatches.length === 0) return;
    setFindMatchIndex(prev => (prev - 1 + findMatches.length) % findMatches.length);
  };

  const handleReplaceOne = () => {
    if (!findText || !activeFileContent || findMatches.length === 0) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    updateFileContent(activeFileContent.replace(regex, replaceText));
  };

  const handleReplaceAll = () => {
    if (!findText || !activeFileContent) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    updateFileContent(activeFileContent.replace(regex, replaceText));
  };

  return {
    isFindOpen,
    setIsFindOpen,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    findMatches,
    findMatchIndex,
    handleNextMatch,
    handlePrevMatch,
    handleReplaceOne,
    handleReplaceAll,
  };
}
