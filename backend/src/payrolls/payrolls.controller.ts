import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PayrollsService } from './payrolls.service.js';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';

@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post()
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get()
  findAll() {
    return this.payrollsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollsService.update(+id, updatePayrollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollsService.remove(+id);
  }
}
