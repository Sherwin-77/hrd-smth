import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthenticationGuard,
  CurrentSession,
  CurrentUser,
  Public,
  type SessionRecord,
} from '@nestjs/authentication';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { SessionResourceDto } from './dto/session-resource.dto.js';
import type { Employee } from '#employees/entities/employee.entity.js';
import { EmployeesRepository } from '#employees/employees.repository.js';
import { EmployeeDetailResourceDto } from '#employees/dto/employee-detail-resource.dto.js';

function sessionMeta(req: Request): {
  userAgent?: string | null;
  ipAddress?: string | null;
} {
  const userAgent =
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : null;
  const ipAddress = typeof req.ip === 'string' ? req.ip : null;
  return { userAgent, ipAddress };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly employees: EmployeesRepository,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.auth.login(
      dto.email,
      dto.password,
      sessionMeta(req),
    );
    return {
      employee: result.employee,
      token: result.token,
      expiresAt: result.expiresAt,
      sessionId: result.sessionId,
    };
  }

  @Post('logout')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentSession() session: SessionRecord): Promise<void> {
    await this.auth.logout(session.id);
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  async me(
    @CurrentUser() employee: Employee,
  ): Promise<EmployeeDetailResourceDto> {
    const full = await this.employees.findOneWithActivePayroll(employee.id);
    if (!full) {
      throw new NotFoundException(`Employee #${employee.id} not found`);
    }
    return EmployeeDetailResourceDto.fromEntity(full);
  }

  @Get('sessions')
  @UseGuards(AuthenticationGuard)
  async listSessions(
    @CurrentUser() employee: Employee,
    @CurrentSession() session: SessionRecord,
  ): Promise<SessionResourceDto[]> {
    const sessions = await this.auth.listSessions(employee.id);
    return sessions.map((s) => SessionResourceDto.fromEntity(s, session.id));
  }

  /**
   * Revoke all sessions except the current one ("log out everywhere else").
   * Use `POST /auth/logout` to revoke only the current session.
   */
  @Delete('sessions')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeOthers(
    @CurrentUser() employee: Employee,
    @CurrentSession() session: SessionRecord,
  ): Promise<void> {
    await this.auth.revokeOtherSessions(employee.id, session.id);
  }

  @Delete('sessions/:id')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeOne(
    @CurrentUser() employee: Employee,
    @Param('id') id: string,
  ): Promise<void> {
    await this.auth.revokeSession(employee.id, id);
  }

  @Post('change-password')
  @UseGuards(AuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() employee: Employee,
    @CurrentSession() session: SessionRecord,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(
      employee.id,
      dto.currentPassword,
      dto.newPassword,
      session.id,
    );
  }
}
