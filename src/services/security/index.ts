/**
 * Security module barrel export
 * Re-exports all security sub-modules for convenient single-import access.
 */
export { SECRET_PATTERNS, redactSecrets } from './secretRedactor';
export type { SecretPattern } from './secretRedactor';
export { KNOWN_ADVISORIES, isVersionVulnerable } from './advisoryDatabase';
export type { KnownAdvisory } from './advisoryDatabase';
export { auditDependencies, processNpmAuditResults } from './dependencyAuditor';
export { analyzeFileContent } from './sourceCodeAnalyzer';
export { applyRemediation, verifyFindingResolution } from './remediationEngine';
export { createVulnerableFixture } from './fixtureGenerator';
