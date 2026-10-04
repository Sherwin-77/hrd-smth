import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeDetailResourceDto } from './dto/employee-detail-resource.dto.js';
import { EmployeeIndexResourceDto } from './dto/employee-index-resource.dto.js';
import { EmployeesRepository } from './employees.repository.js';
import { Employee } from './entities/employee.entity.js';
import { Brackets } from 'typeorm';

export interface PaginatedEmployees {
  data: EmployeeIndexResourceDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employees: EmployeesRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    await this.validateEmailAvailable(createEmployeeDto.email);

    const employee = this.employees.create({
      name: createEmployeeDto.name,
      email: normalize(createEmployeeDto.email),
      phoneNumber: createEmployeeDto.phoneNumber,
      address: createEmployeeDto.address,
      sex: createEmployeeDto.sex,
      birthDate: new Date(createEmployeeDto.birthDate),
      joinAt: new Date(createEmployeeDto.joinAt),
      leaveAt: createEmployeeDto.leaveAt
        ? new Date(createEmployeeDto.leaveAt)
        : null,
      passwordHash: await this.passwords.hash(createEmployeeDto.password),
    });

    try {
      const saved = await this.employees.save(employee);
      stripPasswordHash(saved);
      return saved;
    } catch (error) {
      this.throwIfUniqueViolation(error, createEmployeeDto.email);
      throw error;
    }
  }

  async findAll(query: FindEmployeesQueryDto): Promise<PaginatedEmployees> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const search = query.search?.trim();

    const queryBuilder = this.employees.createQueryBuilder('employee');

    if (search) {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('employee.name ILIKE :search', { search: `%${search}%` })
            .orWhere('employee.email ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    queryBuilder.orderBy(`employee.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);
    
    const [employees, total] = await queryBuilder.getManyAndCount();

    return {
      data: employees.map((employee) =>
        EmployeeIndexResourceDto.fromEntity(employee),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<EmployeeDetailResourceDto> {
    const employee = await this.employees.findOneWithActivePayroll(id);

    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }

    return EmployeeDetailResourceDto.fromEntity(employee);
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOneEntityOrFail(id);

    if (updateEmployeeDto.email) {
      updateEmployeeDto.email = normalize(updateEmployeeDto.email);
    }

    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      await this.validateEmailAvailable(updateEmployeeDto.email);
    }

    const { birthDate, joinAt, leaveAt, password, ...rest } = updateEmployeeDto;
    const merged = this.employees.merge(employee, {
      ...rest,
      ...(birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}),
      ...(joinAt !== undefined ? { joinAt: new Date(joinAt) } : {}),
      ...(leaveAt !== undefined
        ? { leaveAt: leaveAt ? new Date(leaveAt) : null }
        : {}),
      ...(password !== undefined
        ? { passwordHash: await this.passwords.hash(password) }
        : {}),
    });

    try {
      const saved = await this.employees.save(merged);
      stripPasswordHash(saved);
      return saved;
    } catch (error) {
      this.throwIfUniqueViolation(error, updateEmployeeDto.email);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOneEntityOrFail(id);
    await this.employees.remove(employee);
  }

  private async findOneEntityOrFail(id: string): Promise<Employee> {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  private async validateEmailAvailable(email: string): Promise<void> {
    const existing = await this.employees.findOneBy({ email });
    if (existing) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
  }

  private throwIfUniqueViolation(error: unknown, email?: string): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        `Email ${email ?? 'provided'} is already in use`,
      );
    }
  }
}

const normalize = (value: string) => value.trim().normalize('NFC').toLowerCase();

function stripPasswordHash(employee: Employee): void {
  delete (employee as { passwordHash?: unknown }).passwordHash;
}
