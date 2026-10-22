/**
 * Dependency Vulnerability Advisory Database
 * Curated catalog of known CVEs used for fallback & corroboration
 * when npm audit is unavailable or incomplete.
 */
import { SecuritySeverity } from '../../types/securityAudit';

export interface KnownAdvisory {
  package: string;
  vulnerableRange: string;
  fixedVersion: string;
  severity: SecuritySeverity;
  title: string;
  cve?: string;
  advisoryUrl: string;
  isBreaking: boolean;
  breakingExplanation: string;
}

export const KNOWN_ADVISORIES: KnownAdvisory[] = [
  {
    package: 'source-map-js',
    vulnerableRange: '<1.2.2',
    fixedVersion: '1.2.2',
    severity: 'high',
    title: 'source-map-js allows event-loop denial of service through indexed source-map section offsets',
    cve: 'CVE-2024-56332',
    advisoryUrl: 'https://github.com/advisories/GHSA-68fv-2mgg-jv7q',
    isBreaking: false,
    breakingExplanation: 'Safe patch upgrade within 1.x series.',
  },
  {
    package: 'lodash',
    vulnerableRange: '<4.17.21',
    fixedVersion: '4.17.21',
    severity: 'critical',
    title: 'Prototype Pollution in lodash via defaultsDeep, zipObjectDeep and merge',
    cve: 'CVE-2021-23337',
    advisoryUrl: 'https://github.com/advisories/GHSA-35jh-r3h4-6jhm',
    isBreaking: false,
    breakingExplanation: 'Safe patch update to latest 4.x release.',
  },
  {
    package: 'axios',
    vulnerableRange: '<0.21.2',
    fixedVersion: '1.7.9',
    severity: 'high',
    title: 'Server-Side Request Forgery (SSRF) and credential leak on cross-domain redirects',
    cve: 'CVE-2021-3749',
    advisoryUrl: 'https://github.com/advisories/GHSA-cph5-m8f7-6c5x',
    isBreaking: true,
    breakingExplanation: 'Major version upgrade from 0.x to 1.x includes changes to error types and response interceptor contracts.',
  },
  {
    package: 'jsonwebtoken',
    vulnerableRange: '<9.0.0',
    fixedVersion: '9.0.2',
    severity: 'high',
    title: 'Insecure Key Retrieval and algorithm confusion in jsonwebtoken verify',
    cve: 'CVE-2022-23529',
    advisoryUrl: 'https://github.com/advisories/GHSA-27h2-hvpr-p74q',
    isBreaking: true,
    breakingExplanation: 'jsonwebtoken 9.x strictly rejects asymmetric keys with symmetric algorithms and changes callback signatures.',
  },
  {
    package: 'express',
    vulnerableRange: '<4.19.2',
    fixedVersion: '4.21.2',
    severity: 'medium',
    title: 'Open redirect vulnerability in express via malformed URLs',
    cve: 'CVE-2024-29041',
    advisoryUrl: 'https://github.com/advisories/GHSA-qw6h-vgh9-j6wx',
    isBreaking: false,
    breakingExplanation: 'Non-breaking minor update maintaining full Express 4.x backward compatibility.',
  },
  {
    package: 'ws',
    vulnerableRange: '<8.17.1',
    fixedVersion: '8.18.0',
    severity: 'high',
    title: 'ReDoS when handling request headers in ws',
    cve: 'CVE-2024-37890',
    advisoryUrl: 'https://github.com/advisories/GHSA-3h5v-q93c-6h6q',
    isBreaking: false,
    breakingExplanation: 'Minor version upgrade with enhanced header parser guards.',
  },
];

// Helper to check semver range
export function isVersionVulnerable(currentVer: string, vulnerableRange: string): boolean {
  const cleanCurrent = currentVer.replace(/^[^0-9]*/, '');
  const [cMajor, cMinor = 0, cPatch = 0] = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);

  if (vulnerableRange.startsWith('<')) {
    const target = vulnerableRange.replace('<', '').trim();
    const [tMajor, tMinor = 0, tPatch = 0] = target.split('.').map(n => parseInt(n, 10) || 0);

    if (cMajor < tMajor) return true;
    if (cMajor === tMajor && cMinor < tMinor) return true;
    if (cMajor === tMajor && cMinor === tMinor && cPatch < tPatch) return true;
    return false;
  }
  return false;
}

// ==========================================
