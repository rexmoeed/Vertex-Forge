import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../storageService';

describe('StorageService Persistence Layer', () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('stores and retrieves string items with fallback defaults', () => {
    expect(StorageService.getItem('test_key')).toBeNull();
    expect(StorageService.getItem('test_key', 'default_val')).toBe('default_val');

    StorageService.setItem('test_key', 'persisted_val');
    expect(StorageService.getItem('test_key')).toBe('persisted_val');
  });

  it('handles JSON object serialization and deserialization', () => {
    const config = { theme: 'cyber-dark', activeTab: 'explorer', autoSave: true };
    StorageService.setItem('ide_config', config);

    const retrieved = StorageService.getItem<typeof config>('ide_config');
    expect(retrieved).toEqual(config);
    expect(retrieved?.theme).toBe('cyber-dark');
    expect(retrieved?.autoSave).toBe(true);
  });

  it('removes stored items and updates storage state', () => {
    StorageService.setItem('temp_token', 'xyz-123');
    expect(StorageService.getItem('temp_token')).toBe('xyz-123');

    StorageService.removeItem('temp_token');
    expect(StorageService.getItem('temp_token')).toBeNull();
  });

  it('notifies listeners on item updates and removal', () => {
    const listener = vi.fn();
    const unsubscribe = StorageService.subscribe(listener);

    StorageService.setItem('active_view', 'editor');
    expect(listener).toHaveBeenCalledWith('active_view', 'editor');

    StorageService.removeItem('active_view');
    expect(listener).toHaveBeenCalledWith('active_view', null);

    unsubscribe();
    StorageService.setItem('active_view', 'terminal');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('clears all in-memory and local storage records', () => {
    StorageService.setItem('key1', 'val1');
    StorageService.setItem('key2', 'val2');

    StorageService.clear();
    expect(StorageService.getItem('key1')).toBeNull();
    expect(StorageService.getItem('key2')).toBeNull();
  });
});
