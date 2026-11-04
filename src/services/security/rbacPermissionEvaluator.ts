/**
 * Role-Based Access Control (RBAC) Permission Matrix Evaluator
 * Enforces role capabilities and scope barriers across workspace operations.
 */

export type UserRole = 'viewer' | 'developer' | 'lead' | 'admin';

export type WorkspaceAction =
  | 'file:read'
  | 'file:write'
  | 'git:commit'
  | 'git:push'
  | 'vault:read'
  | 'vault:write'
  | 'agent:dispatch'
  | 'agent:stop';

export class RbacPermissionEvaluator {
  private static readonly ROLE_PERMISSIONS: Record<UserRole, WorkspaceAction[]> = {
    viewer: ['file:read'],
    developer: ['file:read', 'file:write', 'git:commit', 'agent:dispatch'],
    lead: ['file:read', 'file:write', 'git:commit', 'git:push', 'agent:dispatch', 'agent:stop', 'vault:read'],
    admin: [
      'file:read',
      'file:write',
      'git:commit',
      'git:push',
      'vault:read',
      'vault:write',
      'agent:dispatch',
      'agent:stop',
    ],
  };

  public static can(role: UserRole, action: WorkspaceAction): boolean {
    const allowedActions = this.ROLE_PERMISSIONS[role] || [];
    return allowedActions.includes(action);
  }

  public static getMissingPermissions(role: UserRole, requiredActions: WorkspaceAction[]): WorkspaceAction[] {
    const allowed = new Set(this.ROLE_PERMISSIONS[role] || []);
    return requiredActions.filter(act => !allowed.has(act));
  }
}
