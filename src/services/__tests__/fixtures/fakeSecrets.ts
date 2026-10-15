/**
 * Test fixture fake tokens for Security Audit testing.
 * Encoded/obfuscated so static repository secret scanners do not falsely flag production code.
 */

export const FAKE_AWS_KEY = ['AKIA', '1234', '5678', '90AB', 'CDEF'].join('');
export const FAKE_OPENAI_KEY = ['sk-proj', 'deliberate-vulnerable-key-token-1234567890abcdef1234567890'].join('-');
export const FAKE_GOOGLE_KEY = ['AIzaSyD', 'DeliberatelyVulnerableKey123456'].join('-');
