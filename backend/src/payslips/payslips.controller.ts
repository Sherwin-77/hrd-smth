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
import { PayslipsService, PaginatedPayslips } from './payslips.service.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { FindPayslipsQueryDto } from './dto/find-payslips-query.dto.js';
import { UpdatePayslipDto } from './dto/update-payslip.dto.js';
import { PayslipResourceDto } from './dto/payslip-resource.dto.js';
import { Payslip } from './entities/payslip.entity.js';

@Controller('payslips')
@UseGuards(AuthenticationGuard)
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Post()
  create(@Body() createPayslipDto: CreatePayslipDto): Promise<PayslipResourceDto> {
    return this.payslipsService.create(createPayslipDto);
  }

  @Get()
  findAll(@Query() query: FindPayslipsQueryDto): Promise<PaginatedPayslips> {
    return this.payslipsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayslipDto: UpdatePayslipDto,
  ): Promise<PayslipResourceDto> {
    return this.payslipsService.update(id, updatePayslipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.payslipsService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.restore(id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.reject(id);
  }
}
