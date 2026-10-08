import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service.js';
import { ContractsController } from './contracts.controller.js';
import { Contract } from './entities/contract.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Employee])],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
