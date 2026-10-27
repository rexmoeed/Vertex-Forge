import { Command, CommandCategory } from '../../../services/commandRegistry';
import { MenuActionContext } from './categories/menuActionContext';
import { getFileCommands } from './categories/fileMenu';
import { getEditCommands, getSelectionCommands } from './categories/editSelectionMenu';
import { getViewCommands, getGoCommands } from './categories/viewGoMenu';
import { getRunCommands, getTerminalCommands } from './categories/runTerminalMenu';
import { getAgentCommands, getHelpCommands } from './categories/agentHelpMenu';

export type { MenuActionContext } from './categories/menuActionContext';

export function getDefaultCategoryCommands(
  cat: CommandCategory,
  ctx: MenuActionContext
): Command[] {
  switch (cat) {
    case 'File':
      return getFileCommands(ctx);
    case 'Edit':
      return getEditCommands(ctx);
    case 'Selection':
      return getSelectionCommands(ctx);
    case 'View':
      return getViewCommands(ctx);
    case 'Go':
      return getGoCommands(ctx);
    case 'Run':
      return getRunCommands(ctx);
    case 'Terminal':
      return getTerminalCommands(ctx);
    case 'Agent / AI':
      return getAgentCommands(ctx);
    case 'Help':
      return getHelpCommands(ctx);
    default:
      return [];
  }
}
