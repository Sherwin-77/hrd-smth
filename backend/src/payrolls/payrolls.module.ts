import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service.js';
import { PayrollsController } from './payrolls.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payroll]),
  ],
  controllers: [PayrollsController],
  providers: [PayrollsService],
})
export class PayrollsModule {}
