import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptedStorageAdapter } from '../encryptedStorageAdapter';

describe('EncryptedStorageAdapter & State Obfuscation', () => {
  let adapter: EncryptedStorageAdapter;

  beforeEach(() => {
    adapter = new EncryptedStorageAdapter('test-cipher-secret');
    adapter.clear();
  });

  it('encrypts and round-trips complex object data cleanly', () => {
    const data = {
      apiKey: 'sk-ant-api03-abcdef1234567890',
      activeWorkspace: '/path/to/project',
      concurrency: 4,
      nested: { flags: [true, false] },
    };

    adapter.setItem('app_session', data);
    const retrieved = adapter.getItem<typeof data>('app_session');

    expect(retrieved).toEqual(data);
  });

  it('detects tampering and refuses to decrypt altered envelopes', () => {
    adapter.setItem('tamper_key', { secret: 'super_confidential' });

    // Simulate tampering with raw storage envelope
    const raw = localStorage.getItem('tamper_key');
    expect(raw).toBeDefined();

    const parsed = JSON.parse(raw!);
    parsed.payload = 'corrupted_base64_payload';
    localStorage.setItem('tamper_key', JSON.stringify(parsed));

    const retrieved = adapter.getItem('tamper_key');
    expect(retrieved).toBeNull();
  });

  it('returns null for non-existent items', () => {
    const missing = adapter.getItem('non_existent_key');
    expect(missing).toBeNull();
  });

  it('removes item and clears storage cleanly', () => {
    adapter.setItem('k1', 'val1');
    adapter.setItem('k2', 'val2');

    adapter.removeItem('k1');
    expect(adapter.getItem('k1')).toBeNull();
    expect(adapter.getItem('k2')).toBe('val2');

    adapter.clear();
    expect(adapter.getItem('k2')).toBeNull();
  });
});
