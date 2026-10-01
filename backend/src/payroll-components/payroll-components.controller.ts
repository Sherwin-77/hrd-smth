import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PayrollComponentsService } from './payroll-components.service.js';
import { CreatePayrollComponentDto } from './dto/create-payroll-component.dto.js';
import { UpdatePayrollComponentDto } from './dto/update-payroll-component.dto.js';

@Controller('payroll-components')
export class PayrollComponentsController {
  constructor(private readonly payrollComponentsService: PayrollComponentsService) {}

  @Post()
  create(@Body() createPayrollComponentDto: CreatePayrollComponentDto) {
    return this.payrollComponentsService.create(createPayrollComponentDto);
  }

  @Get()
  findAll() {
    return this.payrollComponentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollComponentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollComponentDto: UpdatePayrollComponentDto) {
    return this.payrollComponentsService.update(+id, updatePayrollComponentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollComponentsService.remove(+id);
  }
}
