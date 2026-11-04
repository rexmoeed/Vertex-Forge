/**
 * Semantic Version Comparator & Release Tag Validator
 * Validates SemVer 2.0.0 compliance and sorts releases in descending/ascending order.
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  raw: string;
}

export class SemverValidator {
  private static readonly SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

  public static isValid(version: string): boolean {
    if (!version || typeof version !== 'string') return false;
    return this.SEMVER_REGEX.test(version.trim());
  }

  public static parse(version: string): ParsedSemver | null {
    if (!version) return null;
    const match = version.trim().match(this.SEMVER_REGEX);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || undefined,
      raw: version.trim(),
    };
  }

  public static compare(v1: string, v2: string): number {
    const p1 = this.parse(v1);
    const p2 = this.parse(v2);

    if (!p1 && !p2) return 0;
    if (!p1) return -1;
    if (!p2) return 1;

    if (p1.major !== p2.major) return p1.major - p2.major;
    if (p1.minor !== p2.minor) return p1.minor - p2.minor;
    if (p1.patch !== p2.patch) return p1.patch - p2.patch;

    // Prerelease versions have lower precedence than normal versions
    if (p1.prerelease && !p2.prerelease) return -1;
    if (!p1.prerelease && p2.prerelease) return 1;
    if (p1.prerelease && p2.prerelease) {
      return p1.prerelease.localeCompare(p2.prerelease);
    }

    return 0;
  }

  public static sortDescending(versions: string[]): string[] {
    return [...versions].sort((a, b) => this.compare(b, a));
  }

  public static isUpgrade(current: string, target: string): boolean {
    return this.compare(target, current) > 0;
  }
}
