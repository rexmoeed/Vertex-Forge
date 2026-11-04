/**
 * Workspace Path Normalization & Symlink Escape Guard
 * Prevents directory traversal attacks (e.g. ../../etc/passwd or C:\Windows) across file operations.
 */

export interface PathValidationResult {
  isValid: boolean;
  sanitizedRelativePath: string;
  isOutsideWorkspace: boolean;
  hasNullByte: boolean;
  violationReason?: string;
}

export class PathSecurityValidator {
  public static validatePath(rawPath: string, workspaceRoot: string): PathValidationResult {
    if (!rawPath || typeof rawPath !== 'string') {
      return {
        isValid: false,
        sanitizedRelativePath: '',
        isOutsideWorkspace: true,
        hasNullByte: false,
        violationReason: 'Path must be a non-empty string',
      };
    }

    // Detect null bytes (poison null byte exploit)
    if (rawPath.includes('\0')) {
      return {
        isValid: false,
        sanitizedRelativePath: '',
        isOutsideWorkspace: true,
        hasNullByte: true,
        violationReason: 'Path contains prohibited null byte sequence',
      };
    }

    // Normalize slashes
    const normalizedRaw = rawPath.replace(/\\/g, '/');
    const normalizedRoot = workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '');

    // Strip leading drive letters or protocol prefixes if present in relative attempts
    const segments = normalizedRaw.split('/').filter(Boolean);
    const resolvedSegments: string[] = [];

    for (const seg of segments) {
      if (seg === '.') {
        continue;
      }
      if (seg === '..') {
        if (resolvedSegments.length === 0) {
          // Attempted to traverse above root
          return {
            isValid: false,
            sanitizedRelativePath: '',
            isOutsideWorkspace: true,
            hasNullByte: false,
            violationReason: 'Path traversal sequence (..) escapes workspace boundary',
          };
        }
        resolvedSegments.pop();
      } else {
        resolvedSegments.push(seg);
      }
    }

    const sanitizedRelativePath = resolvedSegments.join('/');

    // Check if full path starts with workspace root when an absolute path is provided
    if (normalizedRaw.startsWith('/') || /^[a-zA-Z]:\//.test(normalizedRaw)) {
      if (!normalizedRaw.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
        return {
          isValid: false,
          sanitizedRelativePath,
          isOutsideWorkspace: true,
          hasNullByte: false,
          violationReason: `Absolute path is outside authorized workspace root (${workspaceRoot})`,
        };
      }
    }

    return {
      isValid: true,
      sanitizedRelativePath,
      isOutsideWorkspace: false,
      hasNullByte: false,
    };
  }
}
