import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  IDEPanelConfig,
  DEFAULT_LAYOUT_CONFIG,
  LayoutPreset,
  SidebarPosition,
  EditorSplitOrientation,
  PanelFocusTarget,
  PANEL_CONSTRAINTS,
} from '../types/layout';

interface LayoutContextType {
  config: IDEPanelConfig;
  setPrimarySidebarWidth: (width: number) => void;
  setSecondarySidebarWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  setPreviewWidth: (width: number) => void;
  setEditorSplitRatio: (ratio: number) => void;
  togglePrimarySidebar: () => void;
  toggleSecondarySidebar: () => void;
  toggleBottomPanel: () => void;
  togglePreview: () => void;
  toggleActivityBar: () => void;
  toggleZenMode: () => void;
  toggleBottomPanelMaximized: () => void;
  setPrimarySidebarPosition: (pos: SidebarPosition) => void;
  setSecondarySidebarPosition: (pos: SidebarPosition) => void;
  splitEditor: (orientation: EditorSplitOrientation) => void;
  closeEditorSplit: () => void;
  setActiveEditorGroupIndex: (index: number) => void;
  applyPreset: (preset: LayoutPreset) => void;
  resetLayout: () => void;
  focusPanel: (target: PanelFocusTarget) => void;
}

const STORAGE_KEY = 'vertex_forge_layout_config_v2';

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<IDEPanelConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT_CONFIG;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate keys and numbers to prevent broken layouts
        return {
          ...DEFAULT_LAYOUT_CONFIG,
          ...parsed,
          primarySidebarWidth: Math.max(180, Math.min(600, parsed.primarySidebarWidth || 260)),
          secondarySidebarWidth: Math.max(240, Math.min(700, parsed.secondarySidebarWidth || 340)),
          bottomPanelHeight: Math.max(120, Math.min(320, parsed.bottomPanelHeight || 210)),
          previewWidth: Math.max(280, Math.min(800, parsed.previewWidth || 420)),
          editorSplitRatio: Math.max(0.2, Math.min(0.8, parsed.editorSplitRatio || 0.5)),
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved layout config, using default', e);
    }
    return DEFAULT_LAYOUT_CONFIG;
  });

  // Save on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist layout config', e);
    }
  }, [config]);

  // Handle responsive auto-collapse and balancing for desktop screen sizes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setConfig(prev => {
        let {
          primarySidebarVisible,
          secondarySidebarVisible,
          primarySidebarWidth,
          secondarySidebarWidth,
          previewVisible,
          previewWidth,
          bottomPanelHeight,
        } = prev;

        // 1. Mobile & very narrow screens (< 768px): collapse all sidebars for pure focus
        if (width < 768) {
          primarySidebarVisible = false;
          secondarySidebarVisible = false;
          previewVisible = false;
        } 
        // 2. Compact Tablet / Small Laptop (< 1024px): keep only primary sidebar, collapse secondary
        else if (width < 1024) {
          if (secondarySidebarVisible && primarySidebarVisible) {
            secondarySidebarVisible = false;
          }
          primarySidebarWidth = Math.min(240, primarySidebarWidth);
        } 
        // 3. Compact Desktop (1024px - 1366px, e.g. 1280x800, 1366x768):
        // Auto-balance so explorer + AI + editor all stay clean & readable
        else if (width < 1366) {
          primarySidebarWidth = Math.min(240, primarySidebarWidth);
          secondarySidebarWidth = Math.min(320, secondarySidebarWidth);
          if (previewVisible && secondarySidebarVisible) {
            previewWidth = Math.min(360, previewWidth);
            secondarySidebarWidth = Math.min(280, secondarySidebarWidth);
          }
        }

        // 4. Height balancing for low-height desktops (e.g. 768p / 800p laptops)
        if (height <= 820) {
          bottomPanelHeight = Math.min(210, bottomPanelHeight);
        }

        return {
          ...prev,
          primarySidebarVisible,
          secondarySidebarVisible,
          primarySidebarWidth,
          secondarySidebarWidth,
          previewVisible,
          previewWidth,
          bottomPanelHeight,
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setPrimarySidebarWidth = useCallback((width: number) => {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const activityBar = config.activityBarVisible ? 48 : 0;
    const secondaryW = config.secondarySidebarVisible ? config.secondarySidebarWidth : 0;
    const previewW = config.previewVisible ? config.previewWidth : 0;
    // Guaranteed minimum editor width for crystal-clear readability
    const minEditor = winWidth < 1280 ? 320 : 400;

    const maxAvailable = Math.max(
      PANEL_CONSTRAINTS.primarySidebar.minSize,
      winWidth - activityBar - secondaryW - previewW - minEditor
    );
    const maxAllowed = Math.min(PANEL_CONSTRAINTS.primarySidebar.maxSize, maxAvailable);
    const clamped = Math.max(PANEL_CONSTRAINTS.primarySidebar.minSize, Math.min(maxAllowed, width));
    setConfig(prev => ({ ...prev, primarySidebarWidth: clamped }));
  }, [config.activityBarVisible, config.secondarySidebarVisible, config.secondarySidebarWidth, config.previewVisible, config.previewWidth]);

  const setSecondarySidebarWidth = useCallback((width: number) => {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const activityBar = config.activityBarVisible ? 48 : 0;
    const primaryW = config.primarySidebarVisible ? config.primarySidebarWidth : 0;
    const previewW = config.previewVisible ? config.previewWidth : 0;
    const minEditor = winWidth < 1280 ? 320 : 400;

    const maxAvailable = Math.max(
      PANEL_CONSTRAINTS.secondarySidebar.minSize,
      winWidth - activityBar - primaryW - previewW - minEditor
    );
    const maxAllowed = Math.min(PANEL_CONSTRAINTS.secondarySidebar.maxSize, maxAvailable);
    const clamped = Math.max(PANEL_CONSTRAINTS.secondarySidebar.minSize, Math.min(maxAllowed, width));
    setConfig(prev => ({ ...prev, secondarySidebarWidth: clamped }));
  }, [config.activityBarVisible, config.primarySidebarVisible, config.primarySidebarWidth, config.previewVisible, config.previewWidth]);

  const setBottomPanelHeight = useCallback((height: number) => {
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    // Ensure at least 180px reserved for editor + menu bars vertically
    const maxAvailable = Math.max(
      PANEL_CONSTRAINTS.bottomPanel.minSize,
      winHeight - 200
    );
    const maxAllowed = Math.min(PANEL_CONSTRAINTS.bottomPanel.maxSize, maxAvailable);
    const clamped = Math.max(PANEL_CONSTRAINTS.bottomPanel.minSize, Math.min(maxAllowed, height));
    setConfig(prev => ({ ...prev, bottomPanelHeight: clamped }));
  }, []);

  const setPreviewWidth = useCallback((width: number) => {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const activityBar = config.activityBarVisible ? 48 : 0;
    const primaryW = config.primarySidebarVisible ? config.primarySidebarWidth : 0;
    const secondaryW = config.secondarySidebarVisible ? config.secondarySidebarWidth : 0;
    const minEditor = winWidth < 1280 ? 320 : 400;

    const maxAvailable = Math.max(
      PANEL_CONSTRAINTS.preview.minSize,
      winWidth - activityBar - primaryW - secondaryW - minEditor
    );
    const maxAllowed = Math.min(PANEL_CONSTRAINTS.preview.maxSize, maxAvailable);
    const clamped = Math.max(PANEL_CONSTRAINTS.preview.minSize, Math.min(maxAllowed, width));
    setConfig(prev => ({ ...prev, previewWidth: clamped }));
  }, [config.activityBarVisible, config.primarySidebarVisible, config.primarySidebarWidth, config.secondarySidebarVisible, config.secondarySidebarWidth]);

  const setEditorSplitRatio = useCallback((ratio: number) => {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    setConfig(prev => ({ ...prev, editorSplitRatio: clamped }));
  }, []);

  const togglePrimarySidebar = useCallback(() => {
    setConfig(prev => ({ ...prev, primarySidebarVisible: !prev.primarySidebarVisible }));
  }, []);

  const toggleSecondarySidebar = useCallback(() => {
    setConfig(prev => ({ ...prev, secondarySidebarVisible: !prev.secondarySidebarVisible }));
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setConfig(prev => ({ ...prev, bottomPanelVisible: !prev.bottomPanelVisible }));
  }, []);

  const togglePreview = useCallback(() => {
    setConfig(prev => ({ ...prev, previewVisible: !prev.previewVisible }));
  }, []);

  const toggleActivityBar = useCallback(() => {
    setConfig(prev => ({ ...prev, activityBarVisible: !prev.activityBarVisible }));
  }, []);

  const toggleZenMode = useCallback(() => {
    setConfig(prev => {
      const nextZen = !prev.isZenMode;
      if (nextZen) {
        return {
          ...prev,
          isZenMode: true,
          activityBarVisible: false,
          primarySidebarVisible: false,
          secondarySidebarVisible: false,
          bottomPanelVisible: false,
          previewVisible: false,
        };
      } else {
        return {
          ...prev,
          isZenMode: false,
          activityBarVisible: true,
          primarySidebarVisible: true,
          secondarySidebarVisible: true,
          bottomPanelVisible: true,
        };
      }
    });
  }, []);

  const toggleBottomPanelMaximized = useCallback(() => {
    setConfig(prev => ({ ...prev, bottomPanelMaximized: !prev.bottomPanelMaximized }));
  }, []);

  const setPrimarySidebarPosition = useCallback((pos: SidebarPosition) => {
    setConfig(prev => ({
      ...prev,
      primarySidebarPosition: pos,
      // If primary moves to right, place secondary on left to avoid collision
      secondarySidebarPosition: pos === 'left' ? 'right' : 'left',
    }));
  }, []);

  const setSecondarySidebarPosition = useCallback((pos: SidebarPosition) => {
    setConfig(prev => ({
      ...prev,
      secondarySidebarPosition: pos,
      primarySidebarPosition: pos === 'right' ? 'left' : 'right',
    }));
  }, []);

  const splitEditor = useCallback((orientation: EditorSplitOrientation) => {
    setConfig(prev => ({ ...prev, editorSplit: orientation, editorSplitRatio: 0.5 }));
  }, []);

  const closeEditorSplit = useCallback(() => {
    setConfig(prev => ({ ...prev, editorSplit: 'none', activeEditorGroupIndex: 0 }));
  }, []);

  const setActiveEditorGroupIndex = useCallback((index: number) => {
    setConfig(prev => ({ ...prev, activeEditorGroupIndex: index }));
  }, []);

  const focusPanel = useCallback((target: PanelFocusTarget) => {
    setConfig(prev => {
      const update: Partial<IDEPanelConfig> = { focusedPanel: target };
      if (target === 'primarySidebar' && !prev.primarySidebarVisible) {
        update.primarySidebarVisible = true;
      }
      if (target === 'secondarySidebar' && !prev.secondarySidebarVisible) {
        update.secondarySidebarVisible = true;
      }
      if (target === 'ai' && !prev.secondarySidebarVisible) {
        update.secondarySidebarVisible = true;
      }
      if (target === 'terminal' && !prev.bottomPanelVisible) {
        update.bottomPanelVisible = true;
      }
      if (target === 'preview' && !prev.previewVisible) {
        update.previewVisible = true;
      }
      return { ...prev, ...update };
    });
  }, []);

  const applyPreset = useCallback((preset: LayoutPreset) => {
    setConfig(prev => {
      switch (preset) {
        case 'minimal':
          return {
            ...prev,
            currentPreset: 'minimal',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: false,
            secondarySidebarVisible: false,
            bottomPanelVisible: false,
            previewVisible: false,
            editorSplit: 'none',
          };
        case 'developer':
          return {
            ...prev,
            currentPreset: 'developer',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: true,
            primarySidebarWidth: 260,
            secondarySidebarVisible: false,
            bottomPanelVisible: true,
            bottomPanelHeight: 240,
            previewVisible: false,
            editorSplit: 'none',
          };
        case 'ai':
        case 'ai-dev':
          return {
            ...prev,
            currentPreset: 'ai',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: true,
            primarySidebarWidth: 240,
            secondarySidebarVisible: true,
            secondarySidebarWidth: 380, // Expanded AI assistant
            bottomPanelVisible: true,
            bottomPanelHeight: 200,
            previewVisible: false,
            editorSplit: 'none',
          };
        case 'design':
          return {
            ...prev,
            currentPreset: 'design',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: false,
            secondarySidebarVisible: false,
            previewVisible: true,
            previewWidth: 520, // Wide design preview side-by-side
            bottomPanelVisible: false,
            editorSplit: 'none',
          };
        case 'fullstack':
          return {
            ...prev,
            currentPreset: 'fullstack',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: true,
            primarySidebarWidth: 260,
            secondarySidebarVisible: false,
            bottomPanelVisible: true,
            bottomPanelHeight: 300, // Tall terminal for logs & backend
            previewVisible: false,
            editorSplit: 'vertical', // Dual editor
          };
        case 'debug':
          return {
            ...prev,
            currentPreset: 'debug',
            isZenMode: false,
            activityBarVisible: true,
            primarySidebarVisible: true,
            primarySidebarWidth: 260,
            secondarySidebarVisible: true,
            secondarySidebarWidth: 320,
            bottomPanelVisible: true,
            bottomPanelHeight: 280, // Expanded problems and tests panel
            previewVisible: false,
            editorSplit: 'none',
          };
        case 'zen':
          return {
            ...prev,
            currentPreset: 'zen',
            isZenMode: true,
            activityBarVisible: false,
            primarySidebarVisible: false,
            secondarySidebarVisible: false,
            bottomPanelVisible: false,
            previewVisible: false,
            editorSplit: 'none',
          };
        case 'default':
        default:
          return {
            ...DEFAULT_LAYOUT_CONFIG,
            currentPreset: 'default',
          };
      }
    });
  }, []);

  const resetLayout = useCallback(() => {
    setConfig(DEFAULT_LAYOUT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        config,
        setPrimarySidebarWidth,
        setSecondarySidebarWidth,
        setBottomPanelHeight,
        setPreviewWidth,
        setEditorSplitRatio,
        togglePrimarySidebar,
        toggleSecondarySidebar,
        toggleBottomPanel,
        togglePreview,
        toggleActivityBar,
        toggleZenMode,
        toggleBottomPanelMaximized,
        setPrimarySidebarPosition,
        setSecondarySidebarPosition,
        splitEditor,
        closeEditorSplit,
        setActiveEditorGroupIndex,
        applyPreset,
        resetLayout,
        focusPanel,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
