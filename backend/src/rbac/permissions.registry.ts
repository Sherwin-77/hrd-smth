/**
 * Permission catalog — the source of truth for RBAC.
 *
 * Each resource group exposes two coarse actions: `view` (read-only
 * endpoints) and `manage` (mutations). `manage` implies `view` wherever a
 * check runs (see `satisfiesPermission`), so role rows only store what was
 * explicitly granted.
 *
 * Endpoint decorators reference these constants; `GET /permissions`
 * serves them grouped for the role page; the seed sync upserts them into
 * the `permissions` table. The database never invents permission names —
 * assignment endpoints reject anything not listed here.
 */
export const RbacGroup = {
  EMPLOYEES: 'employees',
  PAYROLLS: 'payrolls',
  PAYSLIPS: 'payslips',
  CONTRACTS: 'contracts',
  ROLES: 'roles',
} as const;

export type RbacGroup = (typeof RbacGroup)[keyof typeof RbacGroup];

export const RBAC_GROUPS: readonly RbacGroup[] = [
  RbacGroup.EMPLOYEES,
  RbacGroup.PAYROLLS,
  RbacGroup.PAYSLIPS,
  RbacGroup.CONTRACTS,
  RbacGroup.ROLES,
];

export const RbacAction = {
  VIEW: 'view',
  MANAGE: 'manage',
} as const;

export type RbacAction = (typeof RbacAction)[keyof typeof RbacAction];

export interface RbacPermissionDefinition {
  name: string;
  group: RbacGroup;
  action: RbacAction;
}

export const RBAC_PERMISSIONS: readonly RbacPermissionDefinition[] = [
  {
    name: 'employees.view',
    group: RbacGroup.EMPLOYEES,
    action: RbacAction.VIEW,
  },
  {
    name: 'employees.manage',
    group: RbacGroup.EMPLOYEES,
    action: RbacAction.MANAGE,
  },
  { name: 'payrolls.view', group: RbacGroup.PAYROLLS, action: RbacAction.VIEW },
  {
    name: 'payrolls.manage',
    group: RbacGroup.PAYROLLS,
    action: RbacAction.MANAGE,
  },
  { name: 'payslips.view', group: RbacGroup.PAYSLIPS, action: RbacAction.VIEW },
  {
    name: 'payslips.manage',
    group: RbacGroup.PAYSLIPS,
    action: RbacAction.MANAGE,
  },
  {
    name: 'contracts.view',
    group: RbacGroup.CONTRACTS,
    action: RbacAction.VIEW,
  },
  {
    name: 'contracts.manage',
    group: RbacGroup.CONTRACTS,
    action: RbacAction.MANAGE,
  },
  { name: 'roles.view', group: RbacGroup.ROLES, action: RbacAction.VIEW },
  { name: 'roles.manage', group: RbacGroup.ROLES, action: RbacAction.MANAGE },
];

/** Name of the seeded system role that bypasses permission checks. */
export const SUPERADMIN_ROLE_NAME = 'superadmin';

const KNOWN_PERMISSIONS = new Set(RBAC_PERMISSIONS.map((p) => p.name));

export function isRbacPermissionName(value: string): boolean {
  return KNOWN_PERMISSIONS.has(value);
}

/**
 * Whether a granted permission set covers a required permission.
 * `<group>.manage` covers `<group>.view`; anything else needs an exact
 * match. Unknown required names never satisfy (fail closed).
 */
export function satisfiesPermission(
  granted: ReadonlySet<string> | readonly string[],
  required: string,
): boolean {
  const set = new Set<string>(granted as Iterable<string>);
  if (set.has(required)) {
    return true;
  }
  if (required.endsWith('.view')) {
    return set.has(`${required.slice(0, -'.view'.length)}.manage`);
  }
  return false;
}
