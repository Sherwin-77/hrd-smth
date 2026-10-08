import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';
import { ContractsController } from './contracts.controller.js';

@Module({
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
