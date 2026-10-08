import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import {
  EmployeeSortField,
  FindEmployeesQueryDto,
} from './dto/find-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeDetailResourceDto } from './dto/employee-detail-resource.dto.js';
import { EmployeeIndexResourceDto } from './dto/employee-index-resource.dto.js';
import {
  PaginatedEmployeesResponseDto,
  PaginatedEmployeesWithPayrollResponseDto,
} from './dto/paginated-employees-resource.dto.js';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { EmployeesRepository } from './employees.repository.js';
import { Employee } from './entities/employee.entity.js';
import { Brackets } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

export interface PaginatedEmployees {
  data: EmployeeIndexResourceDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedEmployeesWithPayroll {
  data: EmployeeDetailResourceDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Wire `sort_by` values (snake_case) mapped to entity columns. */
const EMPLOYEE_SORT_COLUMNS: Record<EmployeeSortField, string> = {
  name: 'name',
  email: 'email',
  join_at: 'joinAt',
  created_at: 'createdAt',
};

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employees: EmployeesRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
    await this.validateEmailAvailable(createEmployeeDto.email);

    const employee = this.employees.create({
      id: uuidv7(),
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
      return EmployeeIndexResourceDto.fromEntity(saved);
    } catch (error) {
      this.throwIfUniqueViolation(error, createEmployeeDto.email);
      throw error;
    }
  }

  async findAll(
    query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = EMPLOYEE_SORT_COLUMNS[query.sortBy ?? 'created_at'];
    const order = query.order ?? 'DESC';

    const search = query.search?.trim();

    const queryBuilder = this.employees.createQueryBuilder('employee');

    if (search) {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('employee.name ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('employee.email ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    queryBuilder
      .orderBy(`employee.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    const response = new PaginatedEmployeesResponseDto();
    response.data = employees.map((employee) =>
      EmployeeIndexResourceDto.fromEntity(employee),
    );
    response.meta = PaginationMetaDto.fromTotal(total, page, limit);
    return response;
  }

  async findOne(id: string): Promise<EmployeeDetailResourceDto> {
    const employee = await this.employees.findOneDetail(id);

    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }

    return EmployeeDetailResourceDto.fromEntity(employee);
  }

  /**
   * Paginated employee index with each row's `activePayroll` mapped.
   * Only employees that have an active payroll are returned — built for
   * the payslip creation flow, where the frontend needs the employee's
   * active payroll id to bind `payroll_id`. Payslips are not loaded here
   * — use `findOne` for the full detail with payslips.
   */
  async findAllWithActivePayroll(
    query: FindEmployeesQueryDto,
  ): Promise<PaginatedEmployeesWithPayrollResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = EMPLOYEE_SORT_COLUMNS[query.sortBy ?? 'created_at'];
    const order = query.order ?? 'DESC';

    const search = query.search?.trim();

    const queryBuilder =
      this.employees.createQueryBuilderWithActivePayroll('employee');

    if (search) {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('employee.name ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('employee.email ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    // The active-payroll join is a LEFT JOIN, so employees without one
    // come back with `payroll.id` NULL — exclude them. `andWhere` appends
    // to the search predicate above instead of overwriting it.
    queryBuilder.andWhere('payroll.id IS NOT NULL');

    queryBuilder
      .orderBy(`employee.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    const response = new PaginatedEmployeesWithPayrollResponseDto();
    response.data = employees.map((employee) =>
      EmployeeDetailResourceDto.fromEntity(employee),
    );
    response.meta = PaginationMetaDto.fromTotal(total, page, limit);
    return response;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<EmployeeIndexResourceDto> {
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
      return EmployeeIndexResourceDto.fromEntity(saved);
    } catch (error) {
      this.throwIfUniqueViolation(error, updateEmployeeDto.email);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const employee = await this.employees.findOneWithRelations(id);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    // Soft-deletes the employee and cascades to payrolls, payslips, and
    // contracts via `cascade: ['soft-remove', 'recover']` on the relations.
    await this.employees.softRemove(employee);
  }

  async restore(id: string): Promise<EmployeeIndexResourceDto> {
    const employee = await this.employees.findOneWithRelations(id, true);
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    if (!employee.deletedAt) {
      return EmployeeIndexResourceDto.fromEntity(employee);
    }
    const recovered = await this.employees.recover(employee);
    return EmployeeIndexResourceDto.fromEntity(recovered);
  }

  private async findOneEntityOrFail(id: string): Promise<Employee> {
    const employee = await this.employees.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  private async validateEmailAvailable(email: string): Promise<void> {
    // `findOneBy` excludes soft-deleted rows, but the unique constraint
    // still reserves emails of soft-deleted employees, so a reuse attempt
    // surfaces as ConflictException via the 23505 handler below.
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

const normalize = (value: string) =>
  value.trim().normalize('NFC').toLowerCase();
