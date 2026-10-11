import {
  RBAC_PERMISSIONS,
  isRbacPermissionName,
  satisfiesPermission,
} from './permissions.registry.js';

describe('permissions.registry', () => {
  it('exposes two actions per resource group', () => {
    expect(RBAC_PERMISSIONS).toHaveLength(10);
    const groups = new Set(RBAC_PERMISSIONS.map((p) => p.group));
    expect(groups).toEqual(
      new Set(['employees', 'payrolls', 'payslips', 'contracts', 'roles']),
    );
  });

  it('recognizes only catalogued names', () => {
    expect(isRbacPermissionName('employees.view')).toBe(true);
    expect(isRbacPermissionName('roles.manage')).toBe(true);
    expect(isRbacPermissionName('employees.delete')).toBe(false);
    expect(isRbacPermissionName('')).toBe(false);
  });

  it('matches exact grants', () => {
    expect(satisfiesPermission(['employees.view'], 'employees.view')).toBe(
      true,
    );
    expect(satisfiesPermission(['employees.view'], 'payrolls.view')).toBe(
      false,
    );
    expect(satisfiesPermission([], 'employees.view')).toBe(false);
  });

  it('lets manage imply view but not the reverse', () => {
    expect(satisfiesPermission(['employees.manage'], 'employees.view')).toBe(
      true,
    );
    expect(satisfiesPermission(['employees.view'], 'employees.manage')).toBe(
      false,
    );
    expect(
      satisfiesPermission(new Set(['payrolls.manage']), 'payrolls.view'),
    ).toBe(true);
  });

  it('fails closed on unknown required names', () => {
    expect(satisfiesPermission(['employees.manage'], 'nope.view')).toBe(false);
    expect(satisfiesPermission(['*'], 'employees.view')).toBe(false);
  });
});
