export type CommandCategory =
  | 'File'
  | 'Edit'
  | 'Selection'
  | 'View'
  | 'Go'
  | 'Run'
  | 'Terminal'
  | 'Agent / AI'
  | 'Project'
  | 'Source Control'
  | 'Window'
  | 'Help';

export interface Command {
  id: string;
  title: string;
  category: CommandCategory;
  shortcut?: string;
  description: string;
  iconName?: string;
  isEnabled?: () => boolean;
  execute: () => void | Promise<void>;
}

class CommandRegistryService {
  private commands: Map<string, Command> = new Map();
  private recentCommandIds: string[] = [];
  private listeners: Array<() => void> = [];

  public register(command: Command) {
    this.commands.set(command.id, command);
    this.notify();
  }

  public registerMany(commands: Command[]) {
    for (const cmd of commands) {
      this.commands.set(cmd.id, cmd);
    }
    this.notify();
  }

  public unregister(id: string) {
    this.commands.delete(id);
    this.notify();
  }

  public get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  public getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  public getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter(c => c.category === category);
  }

  public getRecent(): Command[] {
    return this.recentCommandIds
      .map(id => this.commands.get(id))
      .filter((c): c is Command => c !== undefined);
  }

  public async execute(id: string): Promise<boolean> {
    const cmd = this.commands.get(id);
    if (!cmd) {
      logger.warn(`Command not found: ${id}`);
      return false;
    }

    if (cmd.isEnabled && !cmd.isEnabled()) {
      logger.warn(`Command is disabled: ${id}`);
      return false;
    }

    // Track recently used
    this.recentCommandIds = [id, ...this.recentCommandIds.filter(i => i !== id)].slice(0, 10);

    try {
      await cmd.execute();
      return true;
    } catch (err) {
      logger.error(`Error executing command ${id}:`, err);
      return false;
    }
  }

  public search(query: string): Command[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return this.getAll().filter(c => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCategory = c.category.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      return matchTitle || matchCategory || matchDesc || matchId;
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        logger.error(err);
      }
    }
  }
}

export const CommandRegistry = new CommandRegistryService();
