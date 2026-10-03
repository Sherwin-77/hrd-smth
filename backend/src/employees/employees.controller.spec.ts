import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from '@nestjs/authentication';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { EmployeeSex } from './entities/employee.entity.js';
import { vi } from 'vitest';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: service }],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'supersecret1',
      phoneNumber: '08123456789',
      address: 'Jakarta',
      sex: EmployeeSex.FEMALE,
      birthDate: '1990-01-01',
      joinAt: '2024-01-01',
    };
    service.create.mockResolvedValue({ id: 'uuid', ...dto });
    await expect(controller.create(dto)).resolves.toMatchObject({
      email: dto.email,
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
    const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9d';
    await controller.findOne(id);
    await controller.update(id, { name: 'New Name' });
    await controller.remove(id);
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.update).toHaveBeenCalledWith(id, { name: 'New Name' });
    expect(service.remove).toHaveBeenCalledWith(id);
  });
});
