import { Policy } from '@nestjs/authorization';
import type { Employee } from '#employees/entities/employee.entity.js';
import { RbacService } from './rbac.service.js';
import { satisfiesPermission } from './permissions.registry.js';

/**
 * Single policy for the whole API. Routes declare the permission strings
 * they need via `@Can(RbacPolicy, 'can', (ctx) => [...])`; the check is a
 * string-set cover test over the employee's union of role permissions,
 * with `<group>.manage` implying `<group>.view` and the system superadmin
 * role bypassing every check.
 */
@Policy()
export class RbacPolicy {
  constructor(private readonly rbac: RbacService) {}

  async can(user: Employee | null, ...required: string[]): Promise<boolean> {
    if (!user) {
      return false;
    }
    if (await this.rbac.isSuperadmin(user.id)) {
      return true;
    }
    const granted = await this.rbac.getPermissionNames(user.id);
    return required.every((name) => satisfiesPermission(granted, name));
  }
}
