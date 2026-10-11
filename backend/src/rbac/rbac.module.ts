import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '#employees/entities/employee.entity.js';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { EmployeeRole } from './entities/employee-role.entity.js';
import { RbacService } from './rbac.service.js';
import { RbacPolicy } from './rbac.policy.js';
import { RolesController, PermissionsController } from './roles.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      EmployeeRole,
      Employee,
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [RbacService, RbacPolicy],
  exports: [RbacService],
})
export class RbacModule {}
