import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from '@nestjs/authentication';
import { vi } from 'vitest';
import { PayslipsController } from './payslips.controller.js';
import { PayslipsService } from './payslips.service.js';

describe('PayslipsController', () => {
  let controller: PayslipsController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    simulate: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    approve: ReturnType<typeof vi.fn>;
    reject: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    getStatuses: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      simulate: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      restore: vi.fn(),
      getStatuses: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayslipsController],
      providers: [{ provide: PayslipsService, useValue: service }],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PayslipsController>(PayslipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = {
      payrollId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d',
      basicSalary: 5000,
      date: '2026-01-31',
    };
    service.create.mockResolvedValue({ id: 'uuid', ...dto });
    await expect(controller.create(dto)).resolves.toMatchObject({
      basicSalary: dto.basicSalary,
    });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('simulate delegates to the service', () => {
    const dto = { basicSalary: 5000, overtime: 100 };
    const result = {
      basicSalary: 5000,
      overtime: 100,
      tax: 0,
      bonus: 0,
      deduction: 0,
      total: 5100,
    };
    service.simulate.mockReturnValue(result);
    expect(controller.simulate(dto)).toBe(result);
    expect(service.simulate).toHaveBeenCalledWith(dto);
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
    await controller.update(id, { bonus: 500 });
    await controller.remove(id);
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.update).toHaveBeenCalledWith(id, { bonus: 500 });
    expect(service.remove).toHaveBeenCalledWith(id);
  });

  it('approve/reject/restore forward the id', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';
    await controller.approve(id);
    await controller.reject(id);
    await controller.restore(id);
    expect(service.approve).toHaveBeenCalledWith(id);
    expect(service.reject).toHaveBeenCalledWith(id);
    expect(service.restore).toHaveBeenCalledWith(id);
  });

  it('getStatuses delegates to the service', () => {
    const statuses = [{ value: 'pending', label: 'Pending' }];
    service.getStatuses.mockReturnValue(statuses);
    expect(controller.getStatuses()).toBe(statuses);
    expect(service.getStatuses).toHaveBeenCalledWith();
  });
});
