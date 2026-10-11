import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { RbacService } from './rbac.service.js';
import { RbacPolicy } from './rbac.policy.js';
import {
  CreateRoleDto,
  PermissionGroupDto,
  RoleResourceDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from './dto/role.dto.js';

@Controller('roles')
@UseGuards(AuthenticationGuard)
export class RolesController {
  constructor(private readonly rbac: RbacService) {}

  @Get()
  @Can(RbacPolicy, 'can', () => ['roles.view'])
  findAll(): Promise<RoleResourceDto[]> {
    return this.rbac.listRoles();
  }

  @Get(':id')
  @Can(RbacPolicy, 'can', () => ['roles.view'])
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResourceDto> {
    return this.rbac.getRole(id);
  }

  @Post()
  @Can(RbacPolicy, 'can', () => ['roles.manage'])
  create(@Body() dto: CreateRoleDto): Promise<RoleResourceDto> {
    return this.rbac.createRole(dto.name);
  }

  @Patch(':id')
  @Can(RbacPolicy, 'can', () => ['roles.manage'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResourceDto> {
    return this.rbac.updateRole(id, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Can(RbacPolicy, 'can', () => ['roles.manage'])
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rbac.removeRole(id);
  }

  @Put(':id/permissions')
  @Can(RbacPolicy, 'can', () => ['roles.manage'])
  setPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolePermissionsDto,
  ): Promise<RoleResourceDto> {
    return this.rbac.setRolePermissions(id, dto.permissions);
  }
}

@Controller('permissions')
@UseGuards(AuthenticationGuard)
export class PermissionsController {
  constructor(private readonly rbac: RbacService) {}

  @Get()
  @Can(RbacPolicy, 'can', () => ['roles.view'])
  findAll(): PermissionGroupDto[] {
    return this.rbac.listPermissionCatalog();
  }
}
