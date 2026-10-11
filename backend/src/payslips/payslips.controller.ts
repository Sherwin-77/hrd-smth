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
import { Can } from '@nestjs/authorization';
import { PayslipsService } from './payslips.service.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { FindPayslipsQueryDto } from './dto/find-payslips-query.dto.js';
import { UpdatePayslipDto } from './dto/update-payslip.dto.js';
import { PayslipResourceDto } from './dto/payslip-resource.dto.js';
import { PayslipSimulationResourceDto } from './dto/payslip-simulation-resource.dto.js';
import { SimulatePayslipDto } from './dto/simulate-payslip.dto.js';
import { PaginatedPayslipsResponseDto } from './dto/paginated-payslips-resource.dto.js';
import { EnumResourceDto } from '#common/dto/enum-resource.dto.js';
import { RbacPolicy } from '#rbac/rbac.policy.js';

@Controller('payslips')
@UseGuards(AuthenticationGuard)
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Post()
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  create(
    @Body() createPayslipDto: CreatePayslipDto,
  ): Promise<PayslipResourceDto> {
    return this.payslipsService.create(createPayslipDto);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @Can(RbacPolicy, 'can', () => ['payslips.view'])
  simulate(
    @Body() simulatePayslipDto: SimulatePayslipDto,
  ): PayslipSimulationResourceDto {
    return this.payslipsService.simulate(simulatePayslipDto);
  }

  @Get()
  @Can(RbacPolicy, 'can', () => ['payslips.view'])
  findAll(
    @Query() query: FindPayslipsQueryDto,
  ): Promise<PaginatedPayslipsResponseDto> {
    return this.payslipsService.findAll(query);
  }

  @Get('statuses')
  @Can(RbacPolicy, 'can', () => ['payslips.view'])
  getStatuses(): EnumResourceDto[] {
    return this.payslipsService.getStatuses();
  }

  @Get(':id')
  @Can(RbacPolicy, 'can', () => ['payslips.view'])
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.findOne(id);
  }

  @Patch(':id')
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayslipDto: UpdatePayslipDto,
  ): Promise<PayslipResourceDto> {
    return this.payslipsService.update(id, updatePayslipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.payslipsService.remove(id);
  }

  @Patch(':id/restore')
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.restore(id);
  }

  @Patch(':id/approve')
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  approve(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.approve(id);
  }

  @Patch(':id/reject')
  @Can(RbacPolicy, 'can', () => ['payslips.manage'])
  reject(@Param('id', ParseUUIDPipe) id: string): Promise<PayslipResourceDto> {
    return this.payslipsService.reject(id);
  }
}
