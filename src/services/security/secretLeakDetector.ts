/**
 * Secret Leak Detector
 * Scans code diffs, logs, and prompt payloads for exposed API keys, private keys, and tokens.
 */

export interface SecretLeakHit {
  type: 'openai_key' | 'anthropic_key' | 'github_token' | 'google_ai_key' | 'rsa_private_key' | 'aws_key' | 'generic_token';
  matchedPattern: string;
  line: number;
  snippet: string;
}

export class SecretLeakDetector {
  private static readonly RULES: Array<{ type: SecretLeakHit['type']; regex: RegExp }> = [
    { type: 'openai_key', regex: /sk-[a-zA-Z0-9]{32,64}/g },
    { type: 'anthropic_key', regex: /sk-ant-[a-zA-Z0-9_-]{32,96}/g },
    { type: 'github_token', regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}/g },
    { type: 'google_ai_key', regex: /AIzaSy[a-zA-Z0-9_-]{33}/g },
    { type: 'rsa_private_key', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g },
    { type: 'aws_key', regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g },
  ];

  public static scan(content: string): SecretLeakHit[] {
    if (!content || typeof content !== 'string') return [];

    const lines = content.split('\n');
    const hits: SecretLeakHit[] = [];

    lines.forEach((lineText, lineIdx) => {
      for (const rule of this.RULES) {
        // Reset regex state
        rule.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rule.regex.exec(lineText)) !== null) {
          const rawMatch = match[0];
          const masked = rawMatch.substring(0, 4) + '***' + rawMatch.substring(rawMatch.length - 3);

          hits.push({
            type: rule.type,
            matchedPattern: masked,
            line: lineIdx + 1,
            snippet: lineText.trim().replace(rawMatch, masked),
          });
        }
      }
    });

    return hits;
  }

  public static redact(content: string): string {
    if (!content) return '';
    let result = content;

    for (const rule of this.RULES) {
      rule.regex.lastIndex = 0;
      result = result.replace(rule.regex, '[REDACTED_SECRET]');
    }

    return result;
  }
}
