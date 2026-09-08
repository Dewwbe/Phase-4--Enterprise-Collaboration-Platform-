// Mirrors the Prisma WorkspaceRole enum. Kept as a plain TS enum too so it can be
// referenced from decorators/guards without importing the generated Prisma client
// in every file (keeps the common layer framework-agnostic per Clean Architecture).
export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

// Simple role hierarchy used by the roles guard for "at least this role" checks.
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  [WorkspaceRole.VIEWER]: 0,
  [WorkspaceRole.MEMBER]: 1,
  [WorkspaceRole.ADMIN]: 2,
  [WorkspaceRole.OWNER]: 3,
};
