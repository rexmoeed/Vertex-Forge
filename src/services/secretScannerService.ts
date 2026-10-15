import { SecretScanFinding, TamperManifestEntry } from '../types/kos';

const MANIFEST_STORAGE_KEY = 'vertex_tamper_manifest_v1';

export class SecretScannerService {
  private static manifest: Map<string, TamperManifestEntry> = new Map();

  static {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(MANIFEST_STORAGE_KEY);
        if (stored) {
          const list: TamperManifestEntry[] = JSON.parse(stored);
          list.forEach(item => this.manifest.set(item.path, item));
        }
      }
    } catch (e) {
      console.warn('Failed to load tamper manifest:', e);
    }
  }

  // Regex patterns for credentials
  private static readonly PATTERNS: { type: string; regex: RegExp }[] = [
    { type: 'Google Gemini API Key', regex: /AIza[0-9A-Za-z-_]{30,40}/g },
    { type: 'OpenAI Secret Key', regex: /sk-[a-zA-Z0-9]{32,64}/g },
    { type: 'Anthropic Claude Key', regex: /sk-ant-[a-zA-Z0-9-_]{40,}/g },
    { type: 'GitHub Personal Token', regex: /gh[pousr]_[a-zA-Z0-9]{20,}/g },
    { type: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
    { type: 'Private Encryption Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    { type: 'Database Connection String', regex: /(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+:[^\s"']+@[^\s"']+/gi },
  ];

  public static scanText(text: string, filePath: string): SecretScanFinding[] {
    if (!text) return [];
    const findings: SecretScanFinding[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      for (const { type, regex } of this.PATTERNS) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(lineText)) !== null) {
          const matchedStr = match[0];
          findings.push({
            id: `finding-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type,
            file: filePath,
            line: i + 1,
            matchSnippet: matchedStr.length > 8 ? `${matchedStr.slice(0, 4)}••••${matchedStr.slice(-4)}` : '••••',
            entropy: this.calculateShannonEntropy(matchedStr),
            isAllowlisted: false,
            timestamp: Date.now(),
          });
        }
      }
    }

    return findings;
  }

  public static calculateShannonEntropy(str: string): number {
    if (!str) return 0;
    const len = str.length;
    const freq: Record<string, number> = {};
    for (const c of str) {
      freq[c] = (freq[c] || 0) + 1;
    }
    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return Math.round(entropy * 100) / 100;
  }

  public static registerProtectedFile(filePath: string, content: string): TamperManifestEntry {
    const hash = this.simpleHash(content);
    const entry: TamperManifestEntry = {
      path: filePath,
      expectedSha256: hash,
      actualSha256: hash,
      lastVerified: Date.now(),
      tampered: false,
      protectedBy: 'system',
    };
    this.manifest.set(filePath, entry);
    this.persistManifest();
    return entry;
  }

  public static verifyFile(filePath: string, currentContent: string): { ok: boolean; entry?: TamperManifestEntry } {
    const entry = this.manifest.get(filePath);
    if (!entry) return { ok: true };

    const currentHash = this.simpleHash(currentContent);
    entry.actualSha256 = currentHash;
    entry.lastVerified = Date.now();
    entry.tampered = currentHash !== entry.expectedSha256;
    this.persistManifest();

    return { ok: !entry.tampered, entry };
  }

  public static listManifest(): TamperManifestEntry[] {
    return Array.from(this.manifest.values());
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private static persistManifest(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(Array.from(this.manifest.values())));
      }
    } catch {}
  }
}
