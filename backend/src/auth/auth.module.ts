import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { BearerSessionProvider } from './bearer-session.provider.js';
import { TypeOrmSessionStore } from './typeorm-session.store.js';
import { EmployeeSession } from './entities/session.entity.js';
import { EmployeesModule } from '#employees/employees.module.js';

@Module({
  imports: [EmployeesModule, TypeOrmModule.forFeature([EmployeeSession])],
  controllers: [AuthController],
  providers: [AuthService, TypeOrmSessionStore, BearerSessionProvider],
  exports: [AuthService],
})
export class AuthModule {}
