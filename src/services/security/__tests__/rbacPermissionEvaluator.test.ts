import { describe, it, expect } from 'vitest';
import { RbacPermissionEvaluator } from '../rbacPermissionEvaluator';

describe('RbacPermissionEvaluator & Access Control', () => {
  it('allows viewers only read access', () => {
    expect(RbacPermissionEvaluator.can('viewer', 'file:read')).toBe(true);
    expect(RbacPermissionEvaluator.can('viewer', 'file:write')).toBe(false);
    expect(RbacPermissionEvaluator.can('viewer', 'git:push')).toBe(false);
  });

  it('allows developers write and commit but restricts vault writes and push', () => {
    expect(RbacPermissionEvaluator.can('developer', 'file:write')).toBe(true);
    expect(RbacPermissionEvaluator.can('developer', 'git:commit')).toBe(true);
    expect(RbacPermissionEvaluator.can('developer', 'git:push')).toBe(false);
    expect(RbacPermissionEvaluator.can('developer', 'vault:write')).toBe(false);
  });

  it('grants admins full unrestricted access across all actions', () => {
    const actions = [
      'file:read',
      'file:write',
      'git:commit',
      'git:push',
      'vault:read',
      'vault:write',
      'agent:dispatch',
      'agent:stop',
    ] as const;

    for (const action of actions) {
      expect(RbacPermissionEvaluator.can('admin', action)).toBe(true);
    }
  });

  it('returns exact list of missing permissions for given role', () => {
    const missing = RbacPermissionEvaluator.getMissingPermissions('developer', [
      'file:read',
      'git:push',
      'vault:write',
    ]);

    expect(missing).toEqual(['git:push', 'vault:write']);
  });
});
