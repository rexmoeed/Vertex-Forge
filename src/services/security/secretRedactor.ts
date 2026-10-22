/**
 * Secret Redaction Utilities
 * Pattern-based detection and masking of credentials, API keys, and tokens.
 * Ensures zero sensitive data appears in UI, logs, or server responses.
 */

export interface SecretPattern {
  name: string;
  regex: RegExp;
  maskPrefixLength: number;
}

export const SECRET_PATTERNS: Array<{
  name: string;
  regex: RegExp;
  maskPrefixLength: number;
}> = [
  {
    name: 'AWS Access Key ID',
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    maskPrefixLength: 4,
  },
  {
    name: 'AWS Secret Access Key',
    regex: /(?:aws_secret_access_key|aws_secret|secret_key)\s*[:=]\s*["']([A-Za-z0-9/+=]{40})["']/gi,
    maskPrefixLength: 3,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,82})/g,
    maskPrefixLength: 4,
  },
  {
    name: 'OpenAI API Key',
    regex: /(?:sk-[A-Za-z0-9]{24,48}|sk-proj-[A-Za-z0-9_\-]{40,120})/g,
    maskPrefixLength: 7,
  },
  {
    name: 'Google / Gemini API Key',
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    maskPrefixLength: 6,
  },
  {
    name: 'Anthropic API Key',
    regex: /sk-ant-[A-Za-z0-9_\-]{30,100}/g,
    maskPrefixLength: 7,
  },
  {
    name: 'Database Connection URI with Credentials',
    regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/([^:\s'"]+):([^@\s'"]+)@/g,
    maskPrefixLength: 10,
  },
  {
    name: 'Slack Bot Token',
    regex: /xox[baprs]-[0-9]{10,13}-[A-Za-z0-9_\-]+/g,
    maskPrefixLength: 5,
  },
  {
    name: 'Generic High Entropy Secret or Password',
    regex: /(?:jwt_secret|jwtSecret|api_secret|apiKey|apiSecret|password|db_pass)\s*[:=]\s*["']([^"'\s]{8,})["']/gi,
    maskPrefixLength: 3,
  },
];

/**
 * Redacts any detected secrets in a string, ensuring zero sensitive credentials
 * appear in UI, server responses, or logs.
 */
export function redactSecrets(text: string): string {
  if (!text) return '';
  let redacted = text;

  // Mask private key blocks
  redacted = redacted.replace(
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    '-----BEGIN PRIVATE KEY-----\n[REDACTED PRIVATE KEY BLOCK]\n-----END PRIVATE KEY-----'
  );

  // Mask database credentials
  redacted = redacted.replace(
    /((?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:\s'"]+:)([^@\s'"]+)(@)/g,
    '$1[REDACTED_PASSWORD]$3'
  );

  // Mask specific known token formats
  for (const { regex, maskPrefixLength } of SECRET_PATTERNS) {
    redacted = redacted.replace(regex, (...args) => {
      const match = typeof args[0] === 'string' ? args[0] : '';
      const captured = typeof args[1] === 'string' ? args[1] : null;
      const target = captured || match;
      if (!target || typeof target !== 'string') return '***[REDACTED]***';

      if (target.length <= maskPrefixLength + 2) {
        return captured ? match.replace(captured, '***[REDACTED]***') : '***[REDACTED]***';
      }
      const prefix = target.slice(0, maskPrefixLength);
      const masked = `${prefix}***[REDACTED]***`;
      return captured ? match.replace(captured, masked) : masked;
    });
  }

  return redacted;
}

// ==========================================
