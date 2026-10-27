import { useEffect } from 'react';

export interface UseGlobalShortcutsProps {
  layout: any;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsComposerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVoiceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  runTests: () => void;
  saveCurrentFile: () => void;
  setActiveView: (view: any) => void;
  setActiveSidebarTab: (tab: any) => void;
  debugSession: any;
  debugThread: any;
  debuggerEngine: any;
}

export function useGlobalShortcuts({
  layout,
  setIsCommandPaletteOpen,
  setIsComposerOpen,
  setIsVoiceModalOpen,
  setIsShortcutsOpen,
  runTests,
  saveCurrentFile,
  setActiveView,
  setActiveSidebarTab,
  debugSession,
  debugThread,
  debuggerEngine,
}: UseGlobalShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K or Cmd/Ctrl + P: Command Palette
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Cmd/Ctrl + B : Toggle Primary Sidebar
      else if (isCmdOrCtrl && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + I : Open Cursor Composer
      else if (isCmdOrCtrl && e.key.toLowerCase() === 'i' && !e.shiftKey) {
        e.preventDefault();
        setIsComposerOpen(prev => !prev);
      }
      // Cmd/Ctrl + Alt + B or Cmd/Ctrl + J : Toggle AI Assistant
      else if ((isCmdOrCtrl && e.altKey && e.key.toLowerCase() === 'b') || (isCmdOrCtrl && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        layout.toggleSecondarySidebar();
      }
      // Cmd/Ctrl + ` : Toggle Terminal Dock
      else if (isCmdOrCtrl && e.key === '`') {
        e.preventDefault();
        layout.toggleBottomPanel();
      }
      // Cmd/Ctrl + Shift + M or Cmd/Ctrl + Alt + V : Toggle Voice Coding Assistant
      else if ((isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'm') || (isCmdOrCtrl && e.altKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        setIsVoiceModalOpen(prev => !prev);
      }
      // Cmd/Ctrl + Shift + V : Toggle Live Preview
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        layout.togglePreview();
      }
      // Cmd/Ctrl + Shift + Z : Toggle Zen Mode
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        layout.toggleZenMode();
      }
      // Cmd/Ctrl + \ : Split Editor Right
      else if (isCmdOrCtrl && e.key === '\\') {
        e.preventDefault();
        layout.splitEditor(layout.config.editorSplit === 'vertical' ? 'none' : 'vertical');
      }
      // Cmd/Ctrl + T : Run Vitest Suite
      else if (isCmdOrCtrl && e.key.toLowerCase() === 't') {
        e.preventDefault();
        runTests();
      }
      // Cmd/Ctrl + S : Save File
      else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
      // Cmd/Ctrl + Shift + E : Focus Explorer
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('explorer');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + F : Focus Search
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('search');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + G : Focus Source Control
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('git');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + Shift + X : Focus Extensions
      else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setActiveView('editor');
        setActiveSidebarTab('extensions');
        if (!layout.config.primarySidebarVisible) layout.togglePrimarySidebar();
      }
      // Cmd/Ctrl + , : Settings View
      else if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
      }
      // Cmd/Ctrl + / : Shortcuts cheat sheet
      else if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      // F5 : Start Debugging / Continue
      else if (e.key === 'F5' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (debugSession && debugThread?.status === 'paused') {
          debuggerEngine?.continue();
        } else {
          debuggerEngine?.startSession();
        }
      }
      // Shift + F5 : Stop Debugging
      else if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stopSession();
      }
      // F10 : Step Over
      else if (e.key === 'F10') {
        e.preventDefault();
        debuggerEngine?.stepOver();
      }
      // F11 : Step Into / Out
      else if (e.key === 'F11' && !e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stepInto();
      } else if (e.key === 'F11' && e.shiftKey) {
        e.preventDefault();
        debuggerEngine?.stepOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    layout,
    setIsCommandPaletteOpen,
    setIsComposerOpen,
    setIsVoiceModalOpen,
    setIsShortcutsOpen,
    runTests,
    saveCurrentFile,
    setActiveView,
    setActiveSidebarTab,
    debugSession,
    debugThread,
    debuggerEngine,
  ]);
}
