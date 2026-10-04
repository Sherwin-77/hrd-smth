import { Module } from '@nestjs/common';
import { PayslipsService } from './payslips.service.js';
import { PayslipsController } from './payslips.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payslip } from './entities/payslip.entity.js';
import { Payroll } from '#payrolls/entities/payroll.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payslip, Payroll])],
  controllers: [PayslipsController],
  providers: [PayslipsService],
  exports: [PayslipsService],
})
export class PayslipsModule {}
