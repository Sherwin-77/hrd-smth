import { Test, TestingModule } from '@nestjs/testing';
import { PayrollsService } from './payrolls.service.js';

describe('PayrollsService', () => {
  let service: PayrollsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollsService],
    }).compile();

    service = module.get<PayrollsService>(PayrollsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
