import { describe, it, expect } from 'vitest';
import { KNOWN_ADVISORIES, isVersionVulnerable } from '../advisoryDatabase';

describe('Security: Advisory Database & Semver Vulnerability Matcher', () => {
  it('contains known critical and high severity advisories', () => {
    expect(KNOWN_ADVISORIES.length).toBeGreaterThan(0);
    const lodashAdvisory = KNOWN_ADVISORIES.find(a => a.package === 'lodash');
    expect(lodashAdvisory).toBeDefined();
    expect(lodashAdvisory?.severity).toBe('critical');
    expect(lodashAdvisory?.cve).toBe('CVE-2021-23337');
  });

  describe('isVersionVulnerable semver range evaluation', () => {
    it('correctly identifies vulnerable older patch versions', () => {
      expect(isVersionVulnerable('4.17.15', '<4.17.21')).toBe(true);
      expect(isVersionVulnerable('4.17.20', '<4.17.21')).toBe(true);
    });

    it('correctly identifies safe or patched versions', () => {
      expect(isVersionVulnerable('4.17.21', '<4.17.21')).toBe(false);
      expect(isVersionVulnerable('4.18.0', '<4.17.21')).toBe(false);
      expect(isVersionVulnerable('5.0.0', '<4.17.21')).toBe(false);
    });

    it('correctly identifies vulnerable older major versions', () => {
      expect(isVersionVulnerable('0.21.1', '<1.2.2')).toBe(true);
      expect(isVersionVulnerable('1.1.0', '<1.2.2')).toBe(true);
      expect(isVersionVulnerable('1.2.2', '<1.2.2')).toBe(false);
      expect(isVersionVulnerable('2.0.0', '<1.2.2')).toBe(false);
    });

    it('handles caret or tilde prefixes in version strings gracefully', () => {
      expect(isVersionVulnerable('^4.17.10', '<4.17.21')).toBe(true);
      expect(isVersionVulnerable('~4.17.21', '<4.17.21')).toBe(false);
    });
  });
});
