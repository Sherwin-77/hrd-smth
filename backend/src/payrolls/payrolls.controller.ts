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
import { PayrollsService, PaginatedPayrolls } from './payrolls.service.js';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { FindPayrollsQueryDto } from './dto/find-payrolls-query.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';
import { Payroll } from './entities/payroll.entity.js';

@Controller('payrolls')
@UseGuards(AuthenticationGuard)
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post()
  create(@Body() createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get()
  findAll(@Query() query: FindPayrollsQueryDto): Promise<PaginatedPayrolls> {
    return this.payrollsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Payroll> {
    return this.payrollsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
  ): Promise<Payroll> {
    return this.payrollsService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.payrollsService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<Payroll> {
    return this.payrollsService.restore(id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<Payroll> {
    return this.payrollsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Payroll> {
    return this.payrollsService.deactivate(id);
  }
}
