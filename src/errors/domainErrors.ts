/**
 * Vertex Forge Typed Domain Error Hierarchy & Layering Boundary
 * Enforces typed, structured, user-safe error handling across services and UI context.
 */

export type DomainScope = 'ui' | 'fs' | 'git' | 'ai' | 'operator' | 'security' | 'concurrency';

export type ErrorSeverity = 'info' | 'warn' | 'error' | 'fatal';

export enum DomainErrorCode {
  // General & Lifecycle
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  STATE_TRANSITION_INVALID = 'STATE_TRANSITION_INVALID',

  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  // Security & Permissions
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VAULT_SECRET_MISSING = 'VAULT_SECRET_MISSING',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',

  // Concurrency & File System
  FILE_LOCK_CONFLICT = 'FILE_LOCK_CONFLICT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PATH_TRAVERSAL_DETECTED = 'PATH_TRAVERSAL_DETECTED',
  READ_WRITE_RACE = 'READ_WRITE_RACE',

  // AI & Model Providers
  AI_PROVIDER_UNAVAILABLE = 'AI_PROVIDER_UNAVAILABLE',
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  AI_CONTEXT_OVERFLOW = 'AI_CONTEXT_OVERFLOW',
  AI_PARSING_ERROR = 'AI_PARSING_ERROR',
}

export interface DomainErrorMetadata {
  code: DomainErrorCode;
  domain: DomainScope;
  severity: ErrorSeverity;
  isRecoverable: boolean;
  userFacingMessage: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly domain: DomainScope;
  public readonly severity: ErrorSeverity;
  public readonly isRecoverable: boolean;
  public readonly userFacingMessage: string;
  public readonly timestamp: string;
  public readonly details: Record<string, unknown>;

  constructor(params: {
    message: string;
    code: DomainErrorCode;
    domain: DomainScope;
    severity?: ErrorSeverity;
    isRecoverable?: boolean;
    userFacingMessage?: string;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.code = params.code;
    this.domain = params.domain;
    this.severity = params.severity ?? 'error';
    this.isRecoverable = params.isRecoverable ?? true;
    this.userFacingMessage = params.userFacingMessage ?? params.message;
    this.timestamp = new Date().toISOString();
    this.details = params.details ?? {};

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): DomainErrorMetadata {
    return {
      code: this.code,
      domain: this.domain,
      severity: this.severity,
      isRecoverable: this.isRecoverable,
      userFacingMessage: this.userFacingMessage,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

// -----------------------------------------------------------------------------
// Specialized Domain Subclasses
// -----------------------------------------------------------------------------

export class SecurityGuardError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      code: DomainErrorCode.SECURITY_POLICY_VIOLATION,
      domain: 'security',
      severity: 'fatal',
      isRecoverable: false,
      userFacingMessage: 'Operation blocked by Vertex Forge Security Policy Guard.',
      details,
    });
  }
}

export class FileLockConflictError extends DomainError {
  constructor(filePath: string, ownerAgent: string) {
    super({
      message: `File lock collision: ${filePath} is reserved by ${ownerAgent}`,
      code: DomainErrorCode.FILE_LOCK_CONFLICT,
      domain: 'concurrency',
      severity: 'warn',
      isRecoverable: true,
      userFacingMessage: `File is temporarily locked by parallel agent (${ownerAgent}). Please wait.`,
      details: { filePath, ownerAgent },
    });
  }
}

export class AIProviderOfflineError extends DomainError {
  constructor(providerName: string, endpoint?: string) {
    super({
      message: `AI Provider '${providerName}' is unreachable at ${endpoint || 'remote endpoint'}`,
      code: DomainErrorCode.AI_PROVIDER_UNAVAILABLE,
      domain: 'ai',
      severity: 'warn',
      isRecoverable: true,
      userFacingMessage: `AI Provider (${providerName}) is offline. Using local synthetic fallback.`,
      details: { providerName, endpoint },
    });
  }
}

export class WorkspaceValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      code: DomainErrorCode.VALIDATION_FAILED,
      domain: 'ui',
      severity: 'error',
      isRecoverable: true,
      userFacingMessage: message,
      details,
    });
  }
}

// -----------------------------------------------------------------------------
// Type Guards & Utility Helpers
// -----------------------------------------------------------------------------

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isSecurityGuardError(error: unknown): error is SecurityGuardError {
  return error instanceof SecurityGuardError;
}

export function isFileLockConflictError(error: unknown): error is FileLockConflictError {
  return error instanceof FileLockConflictError;
}

export function toDomainError(
  error: unknown,
  fallbackDomain: DomainScope = 'ui',
  fallbackMessage = 'An unexpected operation error occurred'
): DomainError {
  if (isDomainError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new DomainError({
      message: error.message,
      code: DomainErrorCode.UNKNOWN_ERROR,
      domain: fallbackDomain,
      userFacingMessage: error.message || fallbackMessage,
      details: { originalName: error.name, stack: error.stack },
    });
  }

  return new DomainError({
    message: String(error) || fallbackMessage,
    code: DomainErrorCode.UNKNOWN_ERROR,
    domain: fallbackDomain,
    userFacingMessage: fallbackMessage,
    details: { rawValue: error },
  });
}
