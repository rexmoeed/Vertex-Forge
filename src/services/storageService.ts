/**
 * Unified Storage Service
 * Provides type-safe persistence with in-memory fallbacks, JSON serialization,
 * quota handling, and change subscription across Vertex Forge.
 */
import { logger } from './logger';

export class StorageService {
  private static inMemoryStore: Map<string, string> = new Map();
  private static listeners: Set<(key: string, value: string | null) => void> = new Set();

  public static getItem<T = string>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          try {
            return JSON.parse(raw) as T;
          } catch {
            return raw as unknown as T;
          }
        }
      }
    } catch (err) {
      logger.warn(`[StorageService] Failed to read from localStorage: ${key}`, err);
    }

    const inMem = this.inMemoryStore.get(key);
    if (inMem !== undefined) {
      try {
        return JSON.parse(inMem) as T;
      } catch {
        return inMem as unknown as T;
      }
    }

    return defaultValue !== undefined ? defaultValue : null;
  }

  public static setItem<T>(key: string, value: T): boolean {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    let persistedLocally = false;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, serialized);
        persistedLocally = true;
      }
    } catch (err) {
      logger.warn(`[StorageService] Failed to write to localStorage: ${key}`, err);
    }

    this.inMemoryStore.set(key, serialized);
    this.notify(key, serialized);
    return persistedLocally || true;
  }

  public static removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (err) {
      logger.warn(`[StorageService] Failed to remove key from localStorage: ${key}`, err);
    }
    this.inMemoryStore.delete(key);
    this.notify(key, null);
  }

  public static clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (err) {
      logger.warn('[StorageService] Failed to clear localStorage', err);
    }
    this.inMemoryStore.clear();
  }

  public static subscribe(listener: (key: string, value: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(key: string, value: string | null): void {
    for (const listener of this.listeners) {
      try {
        listener(key, value);
      } catch (err) {
        logger.error('[StorageService] Error notifying storage listener:', err);
      }
    }
  }
}
