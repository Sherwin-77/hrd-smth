import { Module } from '@nestjs/common';
import { PayrollComponentsService } from './payroll-components.service.js';
import { PayrollComponentsController } from './payroll-components.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollComponent } from './entities/payroll-component.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollComponent])
  ],
  controllers: [PayrollComponentsController],
  providers: [PayrollComponentsService],
})
export class PayrollComponentsModule {}
