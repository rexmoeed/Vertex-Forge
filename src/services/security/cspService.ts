/**
 * Content Security Policy (CSP) Header Generator & Validator
 * Enforces strict script, style, and frame boundaries for desktop and web contexts.
 */

export interface CspDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  frameAncestors?: string[];
  upgradeInsecureRequests?: boolean;
}

export class CspService {
  public static readonly DEFAULT_DIRECTIVES: CspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: ["'self'", 'https:', 'wss:', 'http://localhost:*'],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: false,
  };

  public static buildPolicyHeader(directives: Partial<CspDirectives> = {}): string {
    const merged: CspDirectives = { ...this.DEFAULT_DIRECTIVES, ...directives };
    const parts: string[] = [];

    const formatList = (name: string, list?: string[]) => {
      if (list && list.length > 0) {
        parts.push(`${name} ${list.join(' ')}`);
      }
    };

    formatList('default-src', merged.defaultSrc);
    formatList('script-src', merged.scriptSrc);
    formatList('style-src', merged.styleSrc);
    formatList('img-src', merged.imgSrc);
    formatList('connect-src', merged.connectSrc);
    formatList('font-src', merged.fontSrc);
    formatList('object-src', merged.objectSrc);
    formatList('media-src', merged.mediaSrc);
    formatList('frame-src', merged.frameSrc);
    formatList('frame-ancestors', merged.frameAncestors);

    if (merged.upgradeInsecureRequests) {
      parts.push('upgrade-insecure-requests');
    }

    return parts.join('; ');
  }

  public static validatePolicy(policyHeader: string): {
    isValid: boolean;
    issues: string[];
    isStrict: boolean;
  } {
    const issues: string[] = [];
    const lower = policyHeader.toLowerCase();

    if (!lower.includes('default-src')) {
      issues.push('Missing default-src fallback directive');
    }

    if (lower.includes("'unsafe-eval'") && !lower.includes("'wasm-unsafe-eval'")) {
      issues.push("Unsafe 'unsafe-eval' detected without WebAssembly scope restriction");
    }

    if (lower.includes('*') && !lower.includes('localhost')) {
      issues.push('Overly broad wildcard (*) used in origin whitelist');
    }

    const hasObjectNone = lower.includes("object-src 'none'");
    const hasFrameAncestorsNone = lower.includes("frame-ancestors 'none'") || lower.includes("frame-ancestors 'self'");

    const isStrict = issues.length === 0 && hasObjectNone && hasFrameAncestorsNone;

    return {
      isValid: issues.length === 0,
      issues,
      isStrict,
    };
  }
}
