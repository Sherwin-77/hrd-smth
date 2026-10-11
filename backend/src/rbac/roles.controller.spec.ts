import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from '@nestjs/authentication';
import { AuthorizationGuard } from '@nestjs/authorization';
import { vi } from 'vitest';
import { PermissionsController, RolesController } from './roles.controller.js';
import { RbacService } from './rbac.service.js';

describe('RolesController', () => {
  let controller: RolesController;
  let permissionsController: PermissionsController;
  let rbac: {
    listRoles: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    createRole: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
    removeRole: ReturnType<typeof vi.fn>;
    setRolePermissions: ReturnType<typeof vi.fn>;
    listPermissionCatalog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    rbac = {
      listRoles: vi.fn(),
      getRole: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      removeRole: vi.fn(),
      setRolePermissions: vi.fn(),
      listPermissionCatalog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController, PermissionsController],
      providers: [{ provide: RbacService, useValue: rbac }],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RolesController>(RolesController);
    permissionsController = module.get<PermissionsController>(
      PermissionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates role CRUD to the rbac service', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d';
    await controller.findAll();
    await controller.findOne(id);
    await controller.create({ name: 'staff' });
    await controller.update(id, { name: 'staff' });
    await controller.remove(id);
    await controller.setPermissions(id, { permissions: ['employees.view'] });
    expect(rbac.listRoles).toHaveBeenCalledWith();
    expect(rbac.getRole).toHaveBeenCalledWith(id);
    expect(rbac.createRole).toHaveBeenCalledWith('staff');
    expect(rbac.updateRole).toHaveBeenCalledWith(id, 'staff');
    expect(rbac.removeRole).toHaveBeenCalledWith(id);
    expect(rbac.setRolePermissions).toHaveBeenCalledWith(id, [
      'employees.view',
    ]);
  });

  it('serves the permission catalog', () => {
    rbac.listPermissionCatalog.mockReturnValue([]);
    expect(permissionsController.findAll()).toEqual([]);
    expect(rbac.listPermissionCatalog).toHaveBeenCalledWith();
  });
});
