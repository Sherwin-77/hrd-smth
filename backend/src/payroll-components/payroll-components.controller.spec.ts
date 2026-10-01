import { Test, TestingModule } from '@nestjs/testing';
import { PayrollComponentsController } from './payroll-components.controller.js';
import { PayrollComponentsService } from './payroll-components.service.js';

describe('PayrollComponentsController', () => {
  let controller: PayrollComponentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollComponentsController],
      providers: [PayrollComponentsService],
    }).compile();

    controller = module.get<PayrollComponentsController>(PayrollComponentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
