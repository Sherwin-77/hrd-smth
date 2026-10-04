import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import { FindPayrollsQueryDto } from './dto/find-payrolls-query.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';

export interface PaginatedPayrolls {
  data: Payroll[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrolls: Repository<Payroll>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
  ) {}

  async create(createPayrollDto: CreatePayrollDto): Promise<Payroll> {
    const employee = await this.employees.findOneBy({
      id: createPayrollDto.employeeId,
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee #${createPayrollDto.employeeId} not found`,
      );
    }

    await this.validateNoActivePayroll(createPayrollDto.employeeId);

    const payroll = this.payrolls.create({
      employeeId: createPayrollDto.employeeId,
      accountNumber: createPayrollDto.accountNumber,
      accountName: createPayrollDto.accountName,
      taxPercentage: createPayrollDto.taxPercentage,
      status: PayrollStatus.ACTIVE,
    });

    try {
      return await this.payrolls.save(payroll);
    } catch (error) {
      this.throwIfActiveConflict(error, createPayrollDto.employeeId);
      throw error;
    }
  }

  async findAll(query: FindPayrollsQueryDto): Promise<PaginatedPayrolls> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';
    const search = query.search?.trim();

    const queryBuilder = this.payrolls.createQueryBuilder('payroll');

    if (query.employeeId) {
      queryBuilder.andWhere('payroll.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('payroll.status = :status', {
        status: query.status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('payroll.accountNumber ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('payroll.accountName ILIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    queryBuilder
      .orderBy(`payroll.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Payroll> {
    return this.findOneOrFail(id);
  }

  async update(
    id: string,
    updatePayrollDto: UpdatePayrollDto,
  ): Promise<Payroll> {
    const payroll = await this.findOneOrFail(id);
    const merged = this.payrolls.merge(payroll, {
      ...(updatePayrollDto.accountNumber !== undefined
        ? { accountNumber: updatePayrollDto.accountNumber }
        : {}),
      ...(updatePayrollDto.accountName !== undefined
        ? { accountName: updatePayrollDto.accountName }
        : {}),
      ...(updatePayrollDto.taxPercentage !== undefined
        ? { taxPercentage: updatePayrollDto.taxPercentage }
        : {}),
    });
    return this.payrolls.save(merged);
  }

  async remove(id: string): Promise<void> {
    const payroll = await this.findOneOrFail(id, { payslips: true });
    // Soft-deletes the payroll and cascades to its payslips
    // via `cascade: ['soft-remove', 'recover']` on the relation.
    await this.payrolls.softRemove(payroll);
  }

  async restore(id: string): Promise<Payroll> {
    const payroll = await this.payrolls.findOne({
      where: { id },
      relations: { payslips: true },
      withDeleted: true,
    });
    if (!payroll) {
      throw new NotFoundException(`Payroll #${id} not found`);
    }
    if (!payroll.deletedAt) {
      return payroll;
    }
    return this.payrolls.recover(payroll);
  }

  async activate(id: string): Promise<Payroll> {
    const payroll = await this.findOneOrFail(id);
    if (payroll.status === PayrollStatus.ACTIVE) {
      return payroll;
    }
    await this.validateNoActivePayroll(payroll.employeeId, payroll.id);
    payroll.status = PayrollStatus.ACTIVE;
    try {
      return await this.payrolls.save(payroll);
    } catch (error) {
      this.throwIfActiveConflict(error, payroll.employeeId);
      throw error;
    }
  }

  async deactivate(id: string): Promise<Payroll> {
    const payroll = await this.findOneOrFail(id);
    if (payroll.status === PayrollStatus.INACTIVE) {
      return payroll;
    }
    payroll.status = PayrollStatus.INACTIVE;
    return this.payrolls.save(payroll);
  }

  private async findOneOrFail(
    id: string,
    relations?: { payslips: true },
  ): Promise<Payroll> {
    const payroll = relations
      ? await this.payrolls.findOne({ where: { id }, relations })
      : await this.payrolls.findOneBy({ id });
    if (!payroll) {
      throw new NotFoundException(`Payroll #${id} not found`);
    }
    return payroll;
  }

  private async validateNoActivePayroll(
    employeeId: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.payrolls.findOneBy({
      employeeId,
      status: PayrollStatus.ACTIVE,
      ...(excludeId ? { id: Not(excludeId) } : {}),
    });
    if (existing) {
      throw new ConflictException(
        `Employee #${employeeId} already has an active payroll (#${existing.id})`,
      );
    }
  }

  private throwIfActiveConflict(error: unknown, employeeId: string): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new ConflictException(
        `Employee #${employeeId} already has an active payroll`,
      );
    }
  }
}
