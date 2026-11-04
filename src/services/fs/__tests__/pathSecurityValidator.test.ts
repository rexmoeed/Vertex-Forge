import { describe, it, expect } from 'vitest';
import { PathSecurityValidator } from '../pathSecurityValidator';

describe('PathSecurityValidator & Directory Traversal Defense', () => {
  const root = '/workspace/my-project';

  it('validates safe relative paths cleanly', () => {
    const res = PathSecurityValidator.validatePath('src/components/App.tsx', root);

    expect(res.isValid).toBe(true);
    expect(res.isOutsideWorkspace).toBe(false);
    expect(res.sanitizedRelativePath).toBe('src/components/App.tsx');
  });

  it('normalizes backslashes from Windows paths', () => {
    const res = PathSecurityValidator.validatePath('src\\models\\user.ts', root);

    expect(res.isValid).toBe(true);
    expect(res.sanitizedRelativePath).toBe('src/models/user.ts');
  });

  it('detects and blocks directory traversal attempts (..)', () => {
    const res = PathSecurityValidator.validatePath('../../etc/passwd', root);

    expect(res.isValid).toBe(false);
    expect(res.isOutsideWorkspace).toBe(true);
    expect(res.violationReason).toContain('Path traversal');
  });

  it('detects poison null byte sequences', () => {
    const res = PathSecurityValidator.validatePath('safe_file.png\0.exe', root);

    expect(res.isValid).toBe(false);
    expect(res.hasNullByte).toBe(true);
    expect(res.violationReason).toContain('null byte');
  });

  it('validates authorized absolute paths within workspace', () => {
    const res = PathSecurityValidator.validatePath('/workspace/my-project/package.json', root);

    expect(res.isValid).toBe(true);
    expect(res.isOutsideWorkspace).toBe(false);
  });

  it('blocks absolute paths outside workspace root', () => {
    const res = PathSecurityValidator.validatePath('/etc/shadow', root);

    expect(res.isValid).toBe(false);
    expect(res.isOutsideWorkspace).toBe(true);
  });
});
