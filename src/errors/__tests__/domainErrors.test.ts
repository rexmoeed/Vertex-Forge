import { describe, it, expect } from 'vitest';
import {
  DomainError,
  DomainErrorCode,
  SecurityGuardError,
  FileLockConflictError,
  AIProviderOfflineError,
  WorkspaceValidationError,
  isDomainError,
  isSecurityGuardError,
  isFileLockConflictError,
  toDomainError,
} from '../domainErrors';

describe('Domain Error Hierarchy & Layering Boundaries', () => {
  it('instantiates base DomainError with default severity and recoverable flag', () => {
    const error = new DomainError({
      message: 'Base domain error occurred',
      code: DomainErrorCode.VALIDATION_FAILED,
      domain: 'ui',
    });

    expect(error.name).toBe('DomainError');
    expect(error.message).toBe('Base domain error occurred');
    expect(error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(error.domain).toBe('ui');
    expect(error.severity).toBe('error');
    expect(error.isRecoverable).toBe(true);
    expect(error.userFacingMessage).toBe('Base domain error occurred');
    expect(error.timestamp).toBeDefined();

    const json = error.toJSON();
    expect(json.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(json.domain).toBe('ui');
  });

  it('instantiates SecurityGuardError with fatal severity and non-recoverable flag', () => {
    const error = new SecurityGuardError('Blocked arbitrary command injection', { command: 'rm -rf /' });

    expect(error.name).toBe('SecurityGuardError');
    expect(error.severity).toBe('fatal');
    expect(error.isRecoverable).toBe(false);
    expect(error.code).toBe(DomainErrorCode.SECURITY_POLICY_VIOLATION);
    expect(error.domain).toBe('security');
    expect(error.details.command).toBe('rm -rf /');
    expect(isSecurityGuardError(error)).toBe(true);
    expect(isDomainError(error)).toBe(true);
  });

  it('instantiates FileLockConflictError with concurrency details', () => {
    const error = new FileLockConflictError('src/App.tsx', 'Frontend Lead');

    expect(error.code).toBe(DomainErrorCode.FILE_LOCK_CONFLICT);
    expect(error.domain).toBe('concurrency');
    expect(error.severity).toBe('warn');
    expect(error.isRecoverable).toBe(true);
    expect(error.details.filePath).toBe('src/App.tsx');
    expect(error.details.ownerAgent).toBe('Frontend Lead');
    expect(error.userFacingMessage).toContain('Frontend Lead');
    expect(isFileLockConflictError(error)).toBe(true);
  });

  it('instantiates AIProviderOfflineError with fallback instructions', () => {
    const error = new AIProviderOfflineError('Ollama', 'http://localhost:11434');

    expect(error.code).toBe(DomainErrorCode.AI_PROVIDER_UNAVAILABLE);
    expect(error.domain).toBe('ai');
    expect(error.isRecoverable).toBe(true);
    expect(error.userFacingMessage).toContain('synthetic fallback');
  });

  it('instantiates WorkspaceValidationError with error code', () => {
    const error = new WorkspaceValidationError('Invalid workspace name format');

    expect(error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(error.domain).toBe('ui');
  });

  describe('Type Guards & Translator', () => {
    it('correctly discriminates DomainErrors vs native errors', () => {
      const nativeErr = new Error('Standard error');
      const domainErr = new SecurityGuardError('Guard error');

      expect(isDomainError(domainErr)).toBe(true);
      expect(isDomainError(nativeErr)).toBe(false);
      expect(isDomainError('string error')).toBe(false);
      expect(isDomainError(null)).toBe(false);
    });

    it('toDomainError preserves existing DomainErrors', () => {
      const initial = new SecurityGuardError('Do not alter');
      const translated = toDomainError(initial);

      expect(translated).toBe(initial);
    });

    it('toDomainError converts native Error into DomainError', () => {
      const native = new TypeError('Cannot read property of undefined');
      const translated = toDomainError(native, 'fs', 'File read failure');

      expect(translated).toBeInstanceOf(DomainError);
      expect(translated.code).toBe(DomainErrorCode.UNKNOWN_ERROR);
      expect(translated.domain).toBe('fs');
      expect(translated.message).toBe('Cannot read property of undefined');
      expect(translated.details.originalName).toBe('TypeError');
    });

    it('toDomainError handles primitive strings and objects safely', () => {
      const translatedString = toDomainError('String network timeout', 'ai');
      expect(translatedString).toBeInstanceOf(DomainError);
      expect(translatedString.domain).toBe('ai');

      const translatedObj = toDomainError({ code: 500 }, 'operator');
      expect(translatedObj).toBeInstanceOf(DomainError);
      expect(translatedObj.domain).toBe('operator');
    });
  });
});
