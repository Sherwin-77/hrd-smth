import { Test, TestingModule } from '@nestjs/testing';
import { PayrollsController } from './payrolls.controller.js';
import { PayrollsService } from './payrolls.service.js';

describe('PayrollsController', () => {
  let controller: PayrollsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollsController],
      providers: [PayrollsService],
    }).compile();

    controller = module.get<PayrollsController>(PayrollsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
