export interface MenuActionContext {
  ide: any;
  layout: any;
  themeEngine?: any;
  onOpenNewProject?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
  onOpenJulesMission?: () => void;
  handleCycleTheme?: () => void;
  setActiveView?: (view: any) => void;
  focusEditorTextarea?: () => HTMLTextAreaElement | null;
}
