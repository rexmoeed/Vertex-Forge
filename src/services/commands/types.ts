import { Command } from '../commandRegistry';

export interface CommandContext {
  ide: any;
  layout: any;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onOpenNewProject: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
}
