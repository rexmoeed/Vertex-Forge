import { useState, useCallback } from 'react';

export interface FindReplaceState {
  isOpen: boolean;
  findText: string;
  replaceText: string;
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  matchesCount: number;
  currentMatchIndex: number;
}

export function useEditorFindReplaceController() {
  const [state, setState] = useState<FindReplaceState>({
    isOpen: false,
    findText: '',
    replaceText: '',
    matchCase: false,
    matchWholeWord: false,
    useRegex: false,
    matchesCount: 0,
    currentMatchIndex: 0,
  });

  const openFind = useCallback((initialText = '') => {
    setState(prev => ({ ...prev, isOpen: true, findText: initialText || prev.findText }));
  }, []);

  const closeFind = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setFindText = useCallback((findText: string) => {
    setState(prev => ({ ...prev, findText }));
  }, []);

  const setReplaceText = useCallback((replaceText: string) => {
    setState(prev => ({ ...prev, replaceText }));
  }, []);

  const toggleMatchCase = useCallback(() => {
    setState(prev => ({ ...prev, matchCase: !prev.matchCase }));
  }, []);

  const toggleMatchWholeWord = useCallback(() => {
    setState(prev => ({ ...prev, matchWholeWord: !prev.matchWholeWord }));
  }, []);

  const toggleUseRegex = useCallback(() => {
    setState(prev => ({ ...prev, useRegex: !prev.useRegex }));
  }, []);

  const setMatches = useCallback((matchesCount: number, currentMatchIndex: number) => {
    setState(prev => ({ ...prev, matchesCount, currentMatchIndex }));
  }, []);

  return {
    ...state,
    openFind,
    closeFind,
    setFindText,
    setReplaceText,
    toggleMatchCase,
    toggleMatchWholeWord,
    toggleUseRegex,
    setMatches,
  };
}
