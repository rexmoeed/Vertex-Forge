import { describe, it, expect } from 'vitest';
import { SemverValidator } from '../semverValidator';

describe('SemverValidator & Release Version Management', () => {
  it('validates standard Semver strings with or without v prefix', () => {
    expect(SemverValidator.isValid('1.0.0')).toBe(true);
    expect(SemverValidator.isValid('v1.2.3')).toBe(true);
    expect(SemverValidator.isValid('v2.0.0-rc.1')).toBe(true);
    expect(SemverValidator.isValid('invalid-ver')).toBe(false);
    expect(SemverValidator.isValid('1.2')).toBe(false);
  });

  it('parses version components correctly', () => {
    const parsed = SemverValidator.parse('v1.4.15-beta.2');

    expect(parsed).toBeDefined();
    expect(parsed?.major).toBe(1);
    expect(parsed?.minor).toBe(4);
    expect(parsed?.patch).toBe(15);
    expect(parsed?.prerelease).toBe('beta.2');
  });

  it('compares version precedence accurately', () => {
    expect(SemverValidator.compare('1.2.0', '1.1.9')).toBeGreaterThan(0);
    expect(SemverValidator.compare('1.0.0', '2.0.0')).toBeLessThan(0);
    expect(SemverValidator.compare('v1.0.0', '1.0.0')).toBe(0);
    expect(SemverValidator.compare('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
  });

  it('sorts versions in descending release order', () => {
    const unsorted = ['v1.0.0', 'v2.1.0', '1.2.0', 'v2.0.5'];
    const sorted = SemverValidator.sortDescending(unsorted);

    expect(sorted).toEqual(['v2.1.0', 'v2.0.5', '1.2.0', 'v1.0.0']);
  });

  it('evaluates whether a release is an upgrade', () => {
    expect(SemverValidator.isUpgrade('1.2.0', '1.3.0')).toBe(true);
    expect(SemverValidator.isUpgrade('1.2.0', '1.1.0')).toBe(false);
  });
});
