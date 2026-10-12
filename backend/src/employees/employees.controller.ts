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
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeDetailResourceDto } from './dto/employee-detail-resource.dto.js';
import { EmployeeIndexResourceDto } from './dto/employee-index-resource.dto.js';
import { EnumResourceDto } from '#common/dto/enum-resource.dto.js';
import {
  PaginatedEmployeesResponseDto,
  PaginatedEmployeesWithPayrollResponseDto,
} from './dto/paginated-employees-resource.dto.js';
import { RbacPolicy } from '#rbac/rbac.policy.js';
import { RbacService } from '#rbac/rbac.service.js';
import { RoleResourceDto, SetEmployeeRolesDto } from '#rbac/dto/role.dto.js';
import {
  EXCEL_MIME_TYPE,
  exportFilename,
} from '#common/excel/excel-export.helper.js';

@Controller('employees')
@UseGuards(AuthenticationGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly rbac: RbacService,
  ) {}

  @Post()
  @Can(RbacPolicy, 'can', () => ['employees.manage'])
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Can(RbacPolicy, 'can', () => ['employees.view'])
  findAll(
    @Query() query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    return this.employeesService.findAll(query);
  }

  @Get('with-active-payroll')
  @Can(RbacPolicy, 'can', () => ['employees.view'])
  findAllWithActivePayroll(
    @Query() query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesWithPayrollResponseDto> {
    return this.employeesService.findAllWithActivePayroll(query);
  }

  @Get('sexes')
  @Can(RbacPolicy, 'can', () => ['employees.view'])
  getSexes(): EnumResourceDto[] {
    return this.employeesService.getSexes();
  }

  @Get('export')
  @Can(RbacPolicy, 'can', () => ['employees.view'])
  async export(
    @Query() query: FindEmployeesQueryDto,
  ): Promise<StreamableFile> {
    const buffer = await this.employeesService.exportToExcel(query);
    return new StreamableFile(buffer, {
      type: EXCEL_MIME_TYPE,
      disposition: `attachment; filename="${exportFilename('employees')}"`,
    });
  }

  @Get(':id')
  @Can(RbacPolicy, 'can', () => ['employees.view'])
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeDetailResourceDto> {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Can(RbacPolicy, 'can', () => ['employees.manage'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Can(RbacPolicy, 'can', () => ['employees.manage'])
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.employeesService.remove(id);
  }

  @Patch(':id/restore')
  @Can(RbacPolicy, 'can', () => ['employees.manage'])
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.restore(id);
  }

  @Get(':id/roles')
  @Can(RbacPolicy, 'can', () => ['roles.view'])
  findRoles(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleResourceDto[]> {
    return this.rbac.getEmployeeRoles(id);
  }

  @Put(':id/roles')
  @Can(RbacPolicy, 'can', () => ['roles.manage'])
  setRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetEmployeeRolesDto,
  ): Promise<RoleResourceDto[]> {
    return this.rbac.setEmployeeRoles(id, dto.roleIds);
  }
}
