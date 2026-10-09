import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from '@nestjs/authentication';
import { vi } from 'vitest';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    sign: ReturnType<typeof vi.fn>;
    decline: ReturnType<typeof vi.fn>;
    void: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    getTypes: ReturnType<typeof vi.fn>;
    getStatuses: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      sign: vi.fn(),
      decline: vi.fn(),
      void: vi.fn(),
      restore: vi.fn(),
      getTypes: vi.fn(),
      getStatuses: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [{ provide: ContractsService, useValue: service }],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContractsController>(ContractsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = {
      employeeId: '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9c',
      type: 'fixed_time',
      title: 'Software Engineer',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    service.create.mockResolvedValue({ id: 'uuid', ...dto });
    await expect(controller.create(dto)).resolves.toMatchObject({
      title: dto.title,
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
    await controller.update(id, { title: 'Senior Engineer' });
    await controller.remove(id);
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.update).toHaveBeenCalledWith(id, {
      title: 'Senior Engineer',
    });
    expect(service.remove).toHaveBeenCalledWith(id);
  });

  it('sign forwards the id and body', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';
    await controller.sign(id, { signedDate: '2026-02-01' });
    expect(service.sign).toHaveBeenCalledWith(id, {
      signedDate: '2026-02-01',
    });
  });

  it('decline/void/restore forward the id', async () => {
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';
    await controller.decline(id);
    await controller.void(id);
    await controller.restore(id);
    expect(service.decline).toHaveBeenCalledWith(id);
    expect(service.void).toHaveBeenCalledWith(id);
    expect(service.restore).toHaveBeenCalledWith(id);
  });

  it('getTypes delegates to the service', () => {
    const types = [{ value: 'permanent', label: 'Permanent' }];
    service.getTypes.mockReturnValue(types);
    expect(controller.getTypes()).toBe(types);
    expect(service.getTypes).toHaveBeenCalledWith();
  });

  it('getStatuses delegates to the service', () => {
    const statuses = [{ value: 'pending', label: 'Pending' }];
    service.getStatuses.mockReturnValue(statuses);
    expect(controller.getStatuses()).toBe(statuses);
    expect(service.getStatuses).toHaveBeenCalledWith();
  });
});
