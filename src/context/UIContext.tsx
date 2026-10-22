import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type CursorMode = 'ask' | 'edit' | 'agent' | 'review';
export type IDEActiveView = 'editor' | 'welcome' | 'agents' | 'design-system' | 'settings' | 'providers' | 'evolution' | 'bug-detective' | 'watchdog' | 'operator';

export interface UIContextType {
  activeView: IDEActiveView;
  setActiveView: (view: IDEActiveView) => void;
  activeSidebarTab: 'explorer' | 'search' | 'git' | 'debugger' | 'testing' | 'extensions' | 'security' | 'jules';
  setActiveSidebarTab: (tab: 'explorer' | 'search' | 'git' | 'debugger' | 'testing' | 'extensions' | 'security' | 'jules') => void;
  bottomPanelTab: 'terminal' | 'problems' | 'output' | 'debugConsole' | 'aiChat' | 'testExplorer' | 'security';
  setBottomPanelTab: (tab: 'terminal' | 'problems' | 'output' | 'debugConsole' | 'aiChat' | 'testExplorer' | 'security') => void;
  isBottomPanelOpen: boolean;
  setIsBottomPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleBottomPanel: () => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  cursorPosition: { line: number; column: number };
  setCursorPosition: (pos: { line: number; column: number }) => void;
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  isMultiFileReviewOpen: boolean;
  setIsMultiFileReviewOpen: (open: boolean) => void;
  isAcceptanceModalOpen: boolean;
  setIsAcceptanceModalOpen: (open: boolean) => void;
  isControlPanelOpen: boolean;
  setIsControlPanelOpen: (open: boolean) => void;
  isProjectWizardOpen: boolean;
  setIsProjectWizardOpen: (open: boolean) => void;
  isProjectIntelligenceOpen: boolean;
  setIsProjectIntelligenceOpen: (open: boolean) => void;
  isCloseModalOpen: boolean;
  setIsCloseModalOpen: (open: boolean) => void;
  isOpenFolderModalOpen: boolean;
  setIsOpenFolderModalOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export interface UIProviderProps {
  children: React.ReactNode;
  initialView?: IDEActiveView;
}

export const UIProvider: React.FC<UIProviderProps> = ({
  children,
  initialView = 'editor',
}) => {
  const [activeView, setActiveView] = useState<IDEActiveView>(initialView);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'search' | 'git' | 'debugger' | 'testing' | 'extensions' | 'security' | 'jules'>('explorer');
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'problems' | 'output' | 'debugConsole' | 'aiChat' | 'testExplorer' | 'security'>('terminal');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const [cursorMode, setCursorMode] = useState<CursorMode>('agent');

  // Modals state
  const [isMultiFileReviewOpen, setIsMultiFileReviewOpen] = useState(false);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
  const [isProjectIntelligenceOpen, setIsProjectIntelligenceOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isOpenFolderModalOpen, setIsOpenFolderModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const toggleBottomPanel = useCallback(() => {
    setIsBottomPanelOpen(prev => !prev);
  }, []);

  const value = useMemo<UIContextType>(() => ({
    activeView,
    setActiveView,
    activeSidebarTab,
    setActiveSidebarTab,
    bottomPanelTab,
    setBottomPanelTab,
    isBottomPanelOpen,
    setIsBottomPanelOpen,
    toggleBottomPanel,
    showPreview,
    setShowPreview,
    previewDevice,
    setPreviewDevice,
    cursorPosition,
    setCursorPosition,
    cursorMode,
    setCursorMode,
    isMultiFileReviewOpen,
    setIsMultiFileReviewOpen,
    isAcceptanceModalOpen,
    setIsAcceptanceModalOpen,
    isControlPanelOpen,
    setIsControlPanelOpen,
    isProjectWizardOpen,
    setIsProjectWizardOpen,
    isProjectIntelligenceOpen,
    setIsProjectIntelligenceOpen,
    isCloseModalOpen,
    setIsCloseModalOpen,
    isOpenFolderModalOpen,
    setIsOpenFolderModalOpen,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
  }), [
    activeView,
    activeSidebarTab,
    bottomPanelTab,
    isBottomPanelOpen,
    toggleBottomPanel,
    showPreview,
    previewDevice,
    cursorPosition,
    cursorMode,
    isMultiFileReviewOpen,
    isAcceptanceModalOpen,
    isControlPanelOpen,
    isProjectWizardOpen,
    isProjectIntelligenceOpen,
    isCloseModalOpen,
    isOpenFolderModalOpen,
    isVoiceModalOpen,
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
