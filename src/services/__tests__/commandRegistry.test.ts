import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry, Command } from '../commandRegistry';

describe('CommandRegistryService', () => {
  it('registers and retrieves commands', () => {
    const mockCmd: Command = {
      id: 'test.save',
      title: 'Save File',
      category: 'File',
      description: 'Saves current file',
      execute: vi.fn(),
    };

    CommandRegistry.register(mockCmd);
    expect(CommandRegistry.get('test.save')).toEqual(mockCmd);
    expect(CommandRegistry.getAll().some(c => c.id === 'test.save')).toBe(true);
  });

  it('registers multiple commands at once', () => {
    const cmds: Command[] = [
      { id: 'test.copy', title: 'Copy', category: 'Edit', description: 'Copy text', execute: vi.fn() },
      { id: 'test.paste', title: 'Paste', category: 'Edit', description: 'Paste text', execute: vi.fn() },
    ];

    CommandRegistry.registerMany(cmds);
    expect(CommandRegistry.get('test.copy')).toBeDefined();
    expect(CommandRegistry.get('test.paste')).toBeDefined();
  });

  it('unregisters commands cleanly', () => {
    const cmd: Command = { id: 'test.temp', title: 'Temp', category: 'Help', description: 'Temp', execute: vi.fn() };
    CommandRegistry.register(cmd);
    expect(CommandRegistry.get('test.temp')).toBeDefined();

    CommandRegistry.unregister('test.temp');
    expect(CommandRegistry.get('test.temp')).toBeUndefined();
  });

  it('searches commands by title, description, or id', () => {
    const results = CommandRegistry.search('Save File');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('test.save');
  });

  it('executes a command and updates recent commands', async () => {
    const executeMock = vi.fn();
    const cmd: Command = {
      id: 'test.run',
      title: 'Run Build',
      category: 'Run',
      description: 'Runs project build',
      execute: executeMock,
    };

    CommandRegistry.register(cmd);
    const success = await CommandRegistry.execute('test.run');
    expect(success).toBe(true);
    expect(executeMock).toHaveBeenCalled();
    expect(CommandRegistry.getRecent().some(c => c.id === 'test.run')).toBe(true);
  });

  it('returns false when executing a disabled command', async () => {
    const cmd: Command = {
      id: 'test.disabled',
      title: 'Disabled Cmd',
      category: 'File',
      description: 'Disabled',
      isEnabled: () => false,
      execute: vi.fn(),
    };

    CommandRegistry.register(cmd);
    const success = await CommandRegistry.execute('test.disabled');
    expect(success).toBe(false);
  });

  it('retrieves commands by category', () => {
    const fileCommands = CommandRegistry.getByCategory('File');
    expect(fileCommands).toBeDefined();
    expect(Array.isArray(fileCommands)).toBe(true);
    expect(fileCommands.some(c => c.id === 'test.save')).toBe(true);
  });

  it('notifies subscribers on command registration', () => {
    const subscriber = vi.fn();
    const unsubscribe = CommandRegistry.subscribe(subscriber);

    CommandRegistry.register({
      id: 'test.sub',
      title: 'Sub',
      category: 'View',
      description: 'Sub',
      execute: vi.fn(),
    });

    expect(subscriber).toHaveBeenCalled();
    unsubscribe();
  });
});
