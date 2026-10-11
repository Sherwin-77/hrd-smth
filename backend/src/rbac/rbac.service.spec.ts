import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { RbacService } from './rbac.service.js';

function mockQueryBuilder(result: {
  rawMany?: unknown[];
  many?: unknown[];
  count?: number;
}) {
  return {
    select: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue(result.rawMany ?? []),
    getMany: vi.fn().mockResolvedValue(result.many ?? []),
    getCount: vi.fn().mockResolvedValue(result.count ?? 0),
  };
}

describe('RbacService', () => {
  let service: RbacService;
  let roles: {
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    merge: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let permissions: {
    find: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let rolePermissions: {
    find: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let employeeRoles: {
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let employees: {
    findOneBy: ReturnType<typeof vi.fn>;
  };

  const role = {
    id: 'role-id',
    name: 'payroll-staff',
    isSystem: false,
  };

  beforeEach(() => {
    roles = {
      find: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      create: vi.fn().mockImplementation((v: object) => ({ ...v })),
      merge: vi
        .fn()
        .mockImplementation((a: object, b: object) => ({ ...a, ...b })),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    permissions = {
      find: vi.fn(),
      save: vi.fn(),
      create: vi.fn().mockImplementation((v: object) => ({ ...v })),
      createQueryBuilder: vi.fn(),
    };
    rolePermissions = {
      find: vi.fn(),
      save: vi.fn(),
      create: vi.fn().mockImplementation((v: object) => ({ ...v })),
      delete: vi.fn(),
    };
    employeeRoles = {
      find: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      create: vi.fn().mockImplementation((v: object) => ({ ...v })),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    employees = { findOneBy: vi.fn() };
    service = new RbacService(
      roles as never,
      permissions as never,
      rolePermissions as never,
      employeeRoles as never,
      employees as never,
    );
  });

  it('lists the catalog grouped by resource', () => {
    const catalog = service.listPermissionCatalog();
    expect(catalog).toHaveLength(5);
    expect(catalog.map((g) => g.group)).toEqual([
      'employees',
      'payrolls',
      'payslips',
      'contracts',
      'roles',
    ]);
    for (const group of catalog) {
      expect(group.permissions.map((p) => p.action).sort()).toEqual([
        'manage',
        'view',
      ]);
    }
  });

  it('creates a role with a trimmed name', async () => {
    roles.save.mockImplementation(async (v: unknown) => v);
    const created = await service.createRole('  payroll-staff ');
    expect(roles.save).toHaveBeenCalledOnce();
    expect(created.name).toBe('payroll-staff');
    expect(created.permissions).toEqual([]);
  });

  it('rejects empty names and duplicate roles', async () => {
    await expect(service.createRole('   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    roles.save.mockRejectedValue({ code: '23505' });
    await expect(service.createRole('payroll-staff')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('protects the system role from rename and delete', async () => {
    roles.findOneBy.mockResolvedValue({
      ...role,
      name: 'superadmin',
      isSystem: true,
    });
    await expect(service.updateRole('id', 'other')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.removeRole('id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws NotFound for missing roles', async () => {
    roles.findOneBy.mockResolvedValue(null);
    await expect(service.getRole('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.updateRole('missing', 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.removeRole('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects unknown permission names when setting role permissions', async () => {
    roles.findOneBy.mockResolvedValue(role);
    await expect(
      service.setRolePermissions('role-id', ['employees.view', 'nope']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rolePermissions.delete).not.toHaveBeenCalled();
  });

  it('replaces a role permission set, clearing on empty', async () => {
    roles.findOneBy.mockResolvedValue(role);
    permissions.find.mockResolvedValue([
      { name: 'employees.view' },
      { name: 'employees.manage' },
    ]);
    permissions.createQueryBuilder
      .mockReturnValueOnce(
        mockQueryBuilder({
          many: [{ id: 'p1', name: 'employees.view' }],
        }),
      )
      .mockReturnValueOnce(mockQueryBuilder({ many: [] }));
    rolePermissions.save.mockImplementation(async (v: unknown) => v);

    const updated = await service.setRolePermissions('role-id', [
      'employees.view',
    ]);
    expect(rolePermissions.delete).toHaveBeenCalledWith({
      roleId: 'role-id',
    });
    expect(updated.permissions).toEqual(['employees.view']);

    await service.setRolePermissions('role-id', []);
    expect(rolePermissions.save).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown role ids when assigning employee roles', async () => {
    employees.findOneBy.mockResolvedValue({ id: 'emp-id' });
    roles.createQueryBuilder.mockReturnValue(mockQueryBuilder({ many: [] }));
    await expect(
      service.setEmployeeRoles('emp-id', ['missing-role']),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(employeeRoles.delete).not.toHaveBeenCalled();
  });

  it('replaces an employee role set', async () => {
    employees.findOneBy.mockResolvedValue({ id: 'emp-id' });
    roles.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ many: [{ id: 'r1' }] }),
    );
    employeeRoles.save.mockImplementation(async (v: unknown) => v);
    employeeRoles.find.mockResolvedValue([
      { role: { id: 'r1', name: 'staff', isSystem: false } },
    ]);

    const assigned = await service.setEmployeeRoles('emp-id', ['r1']);
    expect(employeeRoles.delete).toHaveBeenCalledWith({
      employeeId: 'emp-id',
    });
    expect(assigned).toHaveLength(1);
  });

  it('syncs only missing catalog permissions', async () => {
    permissions.find.mockResolvedValue([{ name: 'employees.view' }]);
    permissions.save.mockImplementation(async (v: unknown) => v);
    const { created } = await service.syncPermissions();
    expect(created).toBe(9);
    expect(permissions.save).toHaveBeenCalledOnce();
    const saved = permissions.save.mock.calls[0][0] as { name: string }[];
    expect(saved.every((p) => p.name !== 'employees.view')).toBe(true);
  });

  it('assigns the superadmin role idempotently', async () => {
    roles.findOneBy.mockResolvedValue({
      id: 'sys-id',
      name: 'superadmin',
      isSystem: true,
    });
    employeeRoles.findOneBy.mockResolvedValue({
      employeeId: 'emp',
      roleId: 'sys-id',
    });
    await service.assignSuperadmin('emp');
    expect(roles.save).not.toHaveBeenCalled();
    expect(employeeRoles.save).not.toHaveBeenCalled();

    employeeRoles.findOneBy.mockResolvedValue(null);
    employeeRoles.save.mockImplementation(async (v: unknown) => v);
    await service.assignSuperadmin('emp');
    expect(employeeRoles.save).toHaveBeenCalledOnce();
  });
});
