import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from '@nestjs/authentication';
import { vi } from 'vitest';
import { PayrollsController } from './payrolls.controller.js';
import { PayrollsService } from './payrolls.service.js';
import { PayrollStatus } from './entities/payroll.entity.js';

describe('PayrollsController', () => {
  let controller: PayrollsController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    activate: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollsController],
      providers: [{ provide: PayrollsService, useValue: service }],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PayrollsController>(PayrollsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = {
      employeeId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
      accountNumber: '1234567890',
      accountName: 'Jane Doe',
      taxPercentage: 0.05,
      status: PayrollStatus.ACTIVE,
    };
    service.create.mockResolvedValue({ id: 'uuid', ...dto });
    await expect(controller.create(dto)).resolves.toMatchObject({
      accountNumber: dto.accountNumber,
    });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll forwards the query object', async () => {
    const query = { page: 1, limit: 10 };
    service.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne/update/remove forward the id', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';
    await controller.findOne(id);
    await controller.update(id, { accountName: 'New Name' });
    await controller.remove(id);
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.update).toHaveBeenCalledWith(id, {
      accountName: 'New Name',
    });
    expect(service.remove).toHaveBeenCalledWith(id);
  });

  it('activate/deactivate forward the id', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';
    await controller.activate(id);
    await controller.deactivate(id);
    expect(service.activate).toHaveBeenCalledWith(id);
    expect(service.deactivate).toHaveBeenCalledWith(id);
  });
});
