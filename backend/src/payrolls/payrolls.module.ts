import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service.js';
import { PayrollsController } from './payrolls.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, Employee])],
  controllers: [PayrollsController],
  providers: [PayrollsService],
  exports: [PayrollsService],
})
export class PayrollsModule {}
