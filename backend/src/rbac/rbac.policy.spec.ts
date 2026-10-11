import { vi } from 'vitest';
import { RbacPolicy } from './rbac.policy.js';
import type { Employee } from '#employees/entities/employee.entity.js';

describe('RbacPolicy', () => {
  let policy: RbacPolicy;
  let rbac: {
    isSuperadmin: ReturnType<typeof vi.fn>;
    getPermissionNames: ReturnType<typeof vi.fn>;
  };
  const user = { id: 'emp-id' } as Employee;

  beforeEach(() => {
    rbac = { isSuperadmin: vi.fn(), getPermissionNames: vi.fn() };
    policy = new RbacPolicy(rbac as never);
  });

  it('denies guests', async () => {
    await expect(policy.can(null, 'employees.view')).resolves.toBe(false);
    expect(rbac.isSuperadmin).not.toHaveBeenCalled();
  });

  it('lets the system superadmin bypass every check', async () => {
    rbac.isSuperadmin.mockResolvedValue(true);
    await expect(policy.can(user, 'roles.manage')).resolves.toBe(true);
    expect(rbac.getPermissionNames).not.toHaveBeenCalled();
  });

  it('requires every requested permission (union across roles)', async () => {
    rbac.isSuperadmin.mockResolvedValue(false);
    rbac.getPermissionNames.mockResolvedValue([
      'payslips.view',
      'employees.view',
    ]);
    await expect(policy.can(user, 'payslips.view')).resolves.toBe(true);
    await expect(
      policy.can(user, 'payslips.view', 'employees.view'),
    ).resolves.toBe(true);
    await expect(
      policy.can(user, 'payslips.view', 'payrolls.view'),
    ).resolves.toBe(false);
  });

  it('lets manage imply view', async () => {
    rbac.isSuperadmin.mockResolvedValue(false);
    rbac.getPermissionNames.mockResolvedValue(['payslips.manage']);
    await expect(policy.can(user, 'payslips.view')).resolves.toBe(true);
    await expect(policy.can(user, 'payslips.manage')).resolves.toBe(true);
    await expect(policy.can(user, 'payrolls.view')).resolves.toBe(false);
  });
});
