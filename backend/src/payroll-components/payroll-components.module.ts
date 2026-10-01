import { Module } from '@nestjs/common';
import { PayrollComponentsService } from './payroll-components.service.js';
import { PayrollComponentsController } from './payroll-components.controller.js';

@Module({
  controllers: [PayrollComponentsController],
  providers: [PayrollComponentsService],
})
export class PayrollComponentsModule {}
