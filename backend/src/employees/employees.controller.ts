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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeDetailResourceDto } from './dto/employee-detail-resource.dto.js';
import { EmployeeIndexResourceDto } from './dto/employee-index-resource.dto.js';
import {
  PaginatedEmployeesResponseDto,
  PaginatedEmployeesWithPayrollResponseDto,
} from './dto/paginated-employees-resource.dto.js';

@Controller('employees')
@UseGuards(AuthenticationGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  findAll(
    @Query() query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    return this.employeesService.findAll(query);
  }

  @Get('with-active-payroll')
  findAllWithActivePayroll(
    @Query() query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesWithPayrollResponseDto> {
    return this.employeesService.findAllWithActivePayroll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeDetailResourceDto> {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.employeesService.remove(id);
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeIndexResourceDto> {
    return this.employeesService.restore(id);
  }
}
