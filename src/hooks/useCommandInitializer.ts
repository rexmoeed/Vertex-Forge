import { useEffect } from 'react';
import { useIDE } from '../context/IDEContext';
import { useLayout } from '../context/LayoutContext';
import { CommandRegistry, Command } from '../services/commandRegistry';
import { CommandContext } from '../services/commands/types';
import { createFileAndEditCommands } from '../services/commands/fileAndEditCommands';
import { createViewAndWindowCommands } from '../services/commands/viewAndWindowCommands';
import { createRunAndTerminalCommands } from '../services/commands/runAndTerminalCommands';
import { createAiAndHelpCommands } from '../services/commands/aiAndHelpCommands';

interface CommandInitializerProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onOpenNewProject: () => void;
  onOpenComposer?: () => void;
  onOpenCursorRules?: () => void;
}

export function useCommandInitializer(props: CommandInitializerProps) {
  const ide = useIDE();
  const layout = useLayout();

  useEffect(() => {
    const ctx: CommandContext = {
      ide,
      layout,
      ...props,
    };

    const commands: Command[] = [
      ...createFileAndEditCommands(ctx),
      ...createViewAndWindowCommands(ctx),
      ...createRunAndTerminalCommands(ctx),
      ...createAiAndHelpCommands(ctx),
    ];

    CommandRegistry.registerMany(commands);
  }, [
    ide,
    layout,
    props.onOpenCommandPalette,
    props.onOpenShortcuts,
    props.onOpenNewProject,
    props.onOpenComposer,
    props.onOpenCursorRules,
  ]);
}
