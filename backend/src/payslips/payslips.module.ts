import { Module } from '@nestjs/common';
import { PayslipsService } from './payslips.service.js';
import { PayslipsController } from './payslips.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payslip } from './entities/payslip.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payslip])
  ],
  controllers: [PayslipsController],
  providers: [PayslipsService],
})
export class PayslipsModule {}
