import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../enums/workspace-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Marks the minimum workspace role required to access a route.
 * Usage: @Roles(WorkspaceRole.ADMIN)
 * Must be combined with a param providing the workspace id (see RolesGuard).
 */
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);
