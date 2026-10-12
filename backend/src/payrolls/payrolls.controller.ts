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
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationGuard } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { PayrollsService } from './payrolls.service.js';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { FindPayrollsQueryDto } from './dto/find-payrolls-query.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';
import { PayrollResourceDto } from './dto/payroll-resource.dto.js';
import { PaginatedPayrollsResponseDto } from './dto/paginated-payrolls-resource.dto.js';
import { EnumResourceDto } from '#common/dto/enum-resource.dto.js';
import { RbacPolicy } from '#rbac/rbac.policy.js';
import {
  EXCEL_MIME_TYPE,
  exportFilename,
} from '#common/excel/excel-export.helper.js';

@Controller('payrolls')
@UseGuards(AuthenticationGuard)
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post()
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  create(
    @Body() createPayrollDto: CreatePayrollDto,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get()
  @Can(RbacPolicy, 'can', () => ['payrolls.view'])
  findAll(
    @Query() query: FindPayrollsQueryDto,
  ): Promise<PaginatedPayrollsResponseDto> {
    return this.payrollsService.findAll(query);
  }

  @Get('statuses')
  @Can(RbacPolicy, 'can', () => ['payrolls.view'])
  getStatuses(): EnumResourceDto[] {
    return this.payrollsService.getStatuses();
  }

  @Get('export')
  @Can(RbacPolicy, 'can', () => ['payrolls.view'])
  async export(
    @Query() query: FindPayrollsQueryDto,
  ): Promise<StreamableFile> {
    const buffer = await this.payrollsService.exportToExcel(query);
    return new StreamableFile(buffer, {
      type: EXCEL_MIME_TYPE,
      disposition: `attachment; filename="${exportFilename('payrolls')}"`,
    });
  }

  @Get(':id')
  @Can(RbacPolicy, 'can', () => ['payrolls.view'])
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PayrollResourceDto> {
    return this.payrollsService.findOne(id);
  }

  @Patch(':id')
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.payrollsService.remove(id);
  }

  @Patch(':id/restore')
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PayrollResourceDto> {
    return this.payrollsService.restore(id);
  }

  @Patch(':id/activate')
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Can(RbacPolicy, 'can', () => ['payrolls.manage'])
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayrollResourceDto> {
    return this.payrollsService.deactivate(id);
  }
}
