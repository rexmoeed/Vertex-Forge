/**
 * Secure Encrypted Storage Adapter
 * Obfuscates and signs sensitive client state (e.g. BYOK tokens, workspace cache).
 */

export interface StorageEnvelope<T> {
  payload: string;
  iv: string;
  signature: string;
  timestamp: number;
}

export class EncryptedStorageAdapter {
  private memoryFallback = new Map<string, string>();
  private secretKey: string;

  constructor(secretKey = 'vertex-forge-storage-key') {
    this.secretKey = secretKey;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private encode(text: string, iv: string): string {
    const keyBytes = this.secretKey + iv;
    const encoded = text
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ keyBytes.charCodeAt(i % keyBytes.length)))
      .join('');
    return btoa(unescape(encodeURIComponent(encoded)));
  }

  private decode(cipher: string, iv: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(cipher)));
      const keyBytes = this.secretKey + iv;
      return decoded
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ keyBytes.charCodeAt(i % keyBytes.length)))
        .join('');
    } catch {
      throw new Error('Failed to decrypt storage payload: corrupted ciphertext');
    }
  }

  public setItem<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    const iv = Math.random().toString(36).substring(2, 10);
    const payload = this.encode(serialized, iv);
    const signature = this.simpleHash(payload + iv + this.secretKey);

    const envelope: StorageEnvelope<T> = {
      payload,
      iv,
      signature,
      timestamp: Date.now(),
    };

    const envelopeStr = JSON.stringify(envelope);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, envelopeStr);
        return;
      } catch {
        // Fallback to in-memory storage if localStorage quota exceeded
      }
    }
    this.memoryFallback.set(key, envelopeStr);
  }

  public getItem<T>(key: string): T | null {
    let envelopeStr: string | null = null;

    if (typeof localStorage !== 'undefined') {
      try {
        envelopeStr = localStorage.getItem(key);
      } catch {
        // Fallback
      }
    }

    if (!envelopeStr) {
      envelopeStr = this.memoryFallback.get(key) || null;
    }

    if (!envelopeStr) {
      return null;
    }

    try {
      const envelope: StorageEnvelope<T> = JSON.parse(envelopeStr);
      const expectedSig = this.simpleHash(envelope.payload + envelope.iv + this.secretKey);

      if (envelope.signature !== expectedSig) {
        throw new Error('Storage signature mismatch: potential tampering detected');
      }

      const decrypted = this.decode(envelope.payload, envelope.iv);
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  }

  public removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    this.memoryFallback.delete(key);
  }

  public clear(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch {}
    }
    this.memoryFallback.clear();
  }
}

export const secureStorage = new EncryptedStorageAdapter();
