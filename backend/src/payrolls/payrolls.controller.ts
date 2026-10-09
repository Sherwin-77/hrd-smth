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
import { PayrollsService } from './payrolls.service.js';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { FindPayrollsQueryDto } from './dto/find-payrolls-query.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';
import { PayrollResourceDto } from './dto/payroll-resource.dto.js';
import { PaginatedPayrollsResponseDto } from './dto/paginated-payrolls-resource.dto.js';

@Controller('payrolls')
@UseGuards(AuthenticationGuard)
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post()
  create(
    @Body() createPayrollDto: CreatePayrollDto,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get()
  findAll(
    @Query() query: FindPayrollsQueryDto,
  ): Promise<PaginatedPayrollsResponseDto> {
    return this.payrollsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PayrollResourceDto> {
    return this.payrollsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.payrollsService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PayrollResourceDto> {
    return this.payrollsService.restore(id);
  }

  @Patch(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.deactivate(id);
  }
}
