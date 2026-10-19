import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Employee } from '#employees/entities/employee.entity.js';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { EmployeeRole } from './entities/employee-role.entity.js';
import {
  RBAC_GROUPS,
  RBAC_PERMISSIONS,
  SUPERADMIN_ROLE_NAME,
  isRbacPermissionName,
} from './permissions.registry.js';
import {
  PermissionGroupDto,
  PermissionItemDto,
  RoleResourceDto,
} from './dto/role.dto.js';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(EmployeeRole)
    private readonly employeeRoles: Repository<EmployeeRole>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
  ) {}

  /** Grouped permission catalog for the role page. From code, not the DB. */
  listPermissionCatalog(): PermissionGroupDto[] {
    return RBAC_GROUPS.map(
      (group) =>
        new PermissionGroupDto(
          group,
          RBAC_PERMISSIONS.filter((p) => p.group === group).map(
            (p) => new PermissionItemDto(p.name, p.action),
          ),
        ),
    );
  }

  async listRoles(): Promise<RoleResourceDto[]> {
    const roles = await this.roles.find({ order: { name: 'ASC' } });
    const grants = await this.rolePermissions.find({
      relations: { permission: true },
    });
    const byRole = new Map<string, string[]>();
    for (const row of grants) {
      const list = byRole.get(row.roleId) ?? [];
      list.push(row.permission.name);
      byRole.set(row.roleId, list);
    }
    return roles.map((role) =>
      RoleResourceDto.fromRole(role, byRole.get(role.id) ?? []),
    );
  }

  async getRole(id: string): Promise<RoleResourceDto> {
    const role = await this.findRoleOrFail(id);
    return RoleResourceDto.fromRole(role, await this.rolePermissionNames(id));
  }

  async createRole(name: string): Promise<RoleResourceDto> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Role name must not be empty');
    }
    try {
      const saved = await this.roles.save(
        this.roles.create({ id: uuidv7(), name: trimmed, isSystem: false }),
      );
      return RoleResourceDto.fromRole(saved, []);
    } catch (error) {
      this.throwIfUniqueViolation(error, `Role ${trimmed} already exists`);
      throw error;
    }
  }

  async updateRole(id: string, name: string): Promise<RoleResourceDto> {
    const role = await this.findRoleOrFail(id);
    if (role.isSystem) {
      throw new BadRequestException(
        `The ${role.name} role is a system role and cannot be renamed`,
      );
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Role name must not be empty');
    }
    try {
      const saved = await this.roles.save(
        this.roles.merge(role, { name: trimmed }),
      );
      return RoleResourceDto.fromRole(
        saved,
        await this.rolePermissionNames(id),
      );
    } catch (error) {
      this.throwIfUniqueViolation(error, `Role ${trimmed} already exists`);
      throw error;
    }
  }

  async removeRole(id: string): Promise<void> {
    const role = await this.findRoleOrFail(id);
    if (role.isSystem) {
      throw new BadRequestException(
        `The ${role.name} role is a system role and cannot be deleted`,
      );
    }
    await this.roles.remove(role);
  }

  /**
   * Replace a role's permission set. Names must come from the registry;
   * the catalog is synced first so every name has a row.
   */
  async setRolePermissions(
    roleId: string,
    names: string[],
  ): Promise<RoleResourceDto> {
    const role = await this.findRoleOrFail(roleId);
    const unique = [...new Set(names)];
    const unknown = unique.filter((name) => !isRbacPermissionName(name));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown permissions: ${unknown.join(', ')}`,
      );
    }
    await this.syncPermissions();
    const rows = await this.permissions
      .createQueryBuilder('permission')
      .where('permission.name IN (:...names)', {
        names: unique.length > 0 ? unique : [''],
      })
      .getMany();
    await this.rolePermissions.delete({ roleId });
    if (rows.length > 0) {
      await this.rolePermissions.save(
        rows.map((permission) =>
          this.rolePermissions.create({
            roleId,
            permissionId: permission.id,
          }),
        ),
      );
    }
    return RoleResourceDto.fromRole(role, unique);
  }

  /** Roles assigned to an employee (id, name, system flag). */
  async getEmployeeRoles(employeeId: string): Promise<RoleResourceDto[]> {
    await this.findEmployeeOrFail(employeeId);
    const rows = await this.employeeRoles.find({
      where: { employeeId },
      relations: { role: true },
      order: { role: { name: 'ASC' } },
    });
    return rows.map((row) => RoleResourceDto.fromRole(row.role, []));
  }

  /** Replace an employee's role set. All ids must reference existing roles. */
  async setEmployeeRoles(
    employeeId: string,
    roleIds: string[],
  ): Promise<RoleResourceDto[]> {
    await this.findEmployeeOrFail(employeeId);
    const unique = [...new Set(roleIds)];
    if (unique.length > 0) {
      const found = await this.roles
        .createQueryBuilder('role')
        .where('role.id IN (:...ids)', { ids: unique })
        .getMany();
      const foundIds = new Set(found.map((role) => role.id));
      const missing = unique.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(`Role #${missing[0]} not found`);
      }
    }
    await this.employeeRoles.delete({ employeeId });
    if (unique.length > 0) {
      await this.employeeRoles.save(
        unique.map((roleId) =>
          this.employeeRoles.create({ employeeId, roleId }),
        ),
      );
    }
    return this.getEmployeeRoles(employeeId);
  }

  /**
   * Effective permission names for an employee: the union across all of
   * their roles. Loaded fresh on every authorization check — sessions are
   * long-lived, so permissions are never cached on the session.
   */
  async getPermissionNames(employeeId: string): Promise<string[]> {
    const rows = await this.permissions
      .createQueryBuilder('permission')
      .select('DISTINCT permission.name', 'name')
      .innerJoin(
        RolePermission,
        'rolePermission',
        'rolePermission.permissionId = permission.id',
      )
      .innerJoin(
        EmployeeRole,
        'employeeRole',
        'employeeRole.roleId = rolePermission.roleId',
      )
      .where('employeeRole.employeeId = :employeeId', { employeeId })
      .getRawMany<{ name: string }>();
    return rows.map((row) => row.name);
  }

  async isSuperadmin(employeeId: string): Promise<boolean> {
    return await this.employeeRoles
      .createQueryBuilder('employeeRole')
      .innerJoin(Role, 'role', 'role.id = employeeRole.roleId')
      .where('employeeRole.employeeId = :employeeId', { employeeId })
      .andWhere('role.name = :name', { name: SUPERADMIN_ROLE_NAME })
      .andWhere('role.is_system = :isSystem', { isSystem: true })
      .getExists();
  }

  /**
   * Idempotent catalog sync: insert registry entries missing from the
   * `permissions` table. Existing rows (and their ids, referenced by
   * `role_permissions`) are never touched.
   */
  async syncPermissions(): Promise<{ created: number }> {
    const existing = await this.permissions.find({ select: { name: true } });
    const have = new Set(existing.map((p) => p.name));
    const missing = RBAC_PERMISSIONS.filter((p) => !have.has(p.name));
    if (missing.length > 0) {
      await this.permissions.save(
        missing.map((p) =>
          this.permissions.create({
            id: uuidv7(),
            name: p.name,
            group: p.group,
            action: p.action,
          }),
        ),
      );
    }
    return { created: missing.length };
  }

  /** Idempotent: ensure the system superadmin role exists. */
  async ensureSuperadminRole(): Promise<Role> {
    const existing = await this.roles.findOneBy({
      name: SUPERADMIN_ROLE_NAME,
    });
    if (existing) {
      return existing;
    }
    return this.roles.save(
      this.roles.create({
        id: uuidv7(),
        name: SUPERADMIN_ROLE_NAME,
        isSystem: true,
      }),
    );
  }

  /** Idempotent: grant the system superadmin role to an employee. */
  async assignSuperadmin(employeeId: string): Promise<void> {
    const role = await this.ensureSuperadminRole();
    const existing = await this.employeeRoles.findOneBy({
      employeeId,
      roleId: role.id,
    });
    if (!existing) {
      await this.employeeRoles.save(
        this.employeeRoles.create({ employeeId, roleId: role.id }),
      );
    }
  }

  private async findRoleOrFail(id: string): Promise<Role> {
    const role = await this.roles.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  private async findEmployeeOrFail(id: string): Promise<Employee> {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  private async rolePermissionNames(roleId: string): Promise<string[]> {
    const rows = await this.rolePermissions.find({
      where: { roleId },
      relations: { permission: true },
    });
    return rows.map((row) => row.permission.name);
  }

  private throwIfUniqueViolation(error: unknown, message: string): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(message);
    }
  }
}
