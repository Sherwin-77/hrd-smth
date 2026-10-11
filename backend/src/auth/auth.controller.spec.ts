import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { EmployeeDetailResourceDto } from '#employees/dto/employee-detail-resource.dto.js';
import type { Employee } from '#employees/entities/employee.entity.js';

describe('AuthController.me', () => {
  let controller: AuthController;
  let employees: { findOneDetail: ReturnType<typeof vi.fn> };
  let rbac: {
    getPermissionNames: ReturnType<typeof vi.fn>;
    getEmployeeRoles: ReturnType<typeof vi.fn>;
    isSuperadmin: ReturnType<typeof vi.fn>;
  };
  const user = { id: 'emp-id' } as Employee;

  beforeEach(() => {
    employees = { findOneDetail: vi.fn() };
    rbac = {
      getPermissionNames: vi.fn(),
      getEmployeeRoles: vi.fn(),
      isSuperadmin: vi.fn(),
    };
    controller = new AuthController(
      {} as never,
      employees as never,
      rbac as never,
    );
    employees.findOneDetail.mockResolvedValue({
      id: 'emp-id',
      contracts: [],
      payslips: [],
    });
    rbac.getEmployeeRoles.mockResolvedValue([]);
  });

  it('marks the system superadmin even with no granted permissions', async () => {
    rbac.getPermissionNames.mockResolvedValue([]);
    rbac.isSuperadmin.mockResolvedValue(true);

    const resource: EmployeeDetailResourceDto = await controller.me(user);

    expect(resource.permissions).toEqual([]);
    expect(resource.isSuperadmin).toBe(true);
  });

  it('returns granted permissions for regular employees', async () => {
    rbac.getPermissionNames.mockResolvedValue(['employees.view']);
    rbac.isSuperadmin.mockResolvedValue(false);

    const resource: EmployeeDetailResourceDto = await controller.me(user);

    expect(resource.permissions).toEqual(['employees.view']);
    expect(resource.isSuperadmin).toBe(false);
  });
});
