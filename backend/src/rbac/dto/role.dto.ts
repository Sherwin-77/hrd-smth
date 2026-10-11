import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { Role } from '../entities/role.entity.js';

export class CreateRoleDto {
  @Expose({ name: 'name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class UpdateRoleDto {
  @Expose({ name: 'name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class SetRolePermissionsDto {
  @Expose({ name: 'permissions' })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class SetEmployeeRolesDto {
  @Expose({ name: 'role_ids' })
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds: string[];
}

export class RoleResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'is_system' })
  isSystem: boolean;

  @Expose({ name: 'permissions' })
  permissions: string[];

  static fromRole(role: Role, permissions: string[] = []): RoleResourceDto {
    const resource = new RoleResourceDto();
    resource.id = role.id;
    resource.name = role.name;
    resource.isSystem = role.isSystem;
    resource.permissions = [...permissions].sort();
    return resource;
  }
}

export class PermissionItemDto {
  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'action' })
  action: string;

  constructor(name: string, action: string) {
    this.name = name;
    this.action = action;
  }
}

export class PermissionGroupDto {
  @Expose({ name: 'group' })
  group: string;

  @Expose({ name: 'permissions' })
  @Type(() => PermissionItemDto)
  permissions: PermissionItemDto[];

  constructor(group: string, permissions: PermissionItemDto[]) {
    this.group = group;
    this.permissions = permissions;
  }
}
