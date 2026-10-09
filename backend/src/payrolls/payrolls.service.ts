import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreatePayrollDto } from './dto/create-payroll.dto.js';
import {
  FindPayrollsQueryDto,
  PayrollSortField,
} from './dto/find-payrolls-query.dto.js';
import { UpdatePayrollDto } from './dto/update-payroll.dto.js';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';
import { PayrollResourceDto } from './dto/payroll-resource.dto.js';
import { PaginatedPayrollsResponseDto } from './dto/paginated-payrolls-resource.dto.js';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';
import { EnumResourceDto } from '#common/dto/enum-resource.dto.js';
import { assertPayrollAction, PayrollAction } from './payroll.workflow.js';
import { v7 as uuidv7 } from 'uuid';

export interface PaginatedPayrolls {
  data: PayrollResourceDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Wire `sort_by` values (snake_case) mapped to entity columns. */
const PAYROLL_SORT_COLUMNS: Record<PayrollSortField, string> = {
  account_number: 'accountNumber',
  account_name: 'accountName',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

@Injectable()
export class PayrollsService {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrolls: Repository<Payroll>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
  ) {}

  async create(
    createPayrollDto: CreatePayrollDto,
  ): Promise<PayrollResourceDto> {
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
      id: uuidv7(),
      employeeId: createPayrollDto.employeeId,
      accountNumber: createPayrollDto.accountNumber,
      accountName: createPayrollDto.accountName,
      taxPercentage: createPayrollDto.taxPercentage,
      status: PayrollStatus.ACTIVE,
    });

    try {
      const saved = await this.payrolls.save(payroll);
      return PayrollResourceDto.fromEntity(saved);
    } catch (error) {
      this.throwIfActiveConflict(error, createPayrollDto.employeeId);
      throw error;
    }
  }

  async findAll(
    query: FindPayrollsQueryDto,
  ): Promise<PaginatedPayrollsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = PAYROLL_SORT_COLUMNS[query.sortBy ?? 'created_at'];
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

    const [payrolls, total] = await queryBuilder.getManyAndCount();

    const response = new PaginatedPayrollsResponseDto();
    response.data = payrolls.map((payroll) =>
      PayrollResourceDto.fromEntity(payroll),
    );
    response.meta = PaginationMetaDto.fromTotal(total, page, limit);
    return response;
  }

  async findOne(id: string): Promise<PayrollResourceDto> {
    return PayrollResourceDto.fromEntity(await this.findOneOrFail(id));
  }

  getStatuses(): EnumResourceDto[] {
    return EnumResourceDto.fromEnum(PayrollStatus);
  }

  async update(
    id: string,
    updatePayrollDto: UpdatePayrollDto,
  ): Promise<PayrollResourceDto> {
    const payroll = await this.findOneOrFail(id);
    assertPayrollAction(payroll, PayrollAction.UPDATE);
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
    return PayrollResourceDto.fromEntity(await this.payrolls.save(merged));
  }

  async remove(id: string): Promise<void> {
    const payroll = await this.findOneOrFail(id);
    assertPayrollAction(payroll, PayrollAction.DELETE);
    // Soft-deletes only the payroll. Payslips survive and stay linked
    // to the employee via `payslip.employeeId` until the employee itself
    // is soft-deleted (cascade lives on `Employee.payslips`).
    await this.payrolls.softRemove(payroll);
  }

  async restore(id: string): Promise<PayrollResourceDto> {
    const payroll = await this.payrolls.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!payroll) {
      throw new NotFoundException(`Payroll #${id} not found`);
    }
    if (!payroll.deletedAt) {
      return PayrollResourceDto.fromEntity(payroll);
    }
    return PayrollResourceDto.fromEntity(await this.payrolls.recover(payroll));
  }

  async activate(id: string): Promise<PayrollResourceDto> {
    const payroll = await this.findOneOrFail(id);
    if (payroll.status === PayrollStatus.ACTIVE) {
      return PayrollResourceDto.fromEntity(payroll);
    }
    assertPayrollAction(payroll, PayrollAction.ACTIVATE);
    await this.validateNoActivePayroll(payroll.employeeId, payroll.id);
    payroll.status = PayrollStatus.ACTIVE;
    try {
      return PayrollResourceDto.fromEntity(await this.payrolls.save(payroll));
    } catch (error) {
      this.throwIfActiveConflict(error, payroll.employeeId);
      throw error;
    }
  }

  async deactivate(id: string): Promise<PayrollResourceDto> {
    const payroll = await this.findOneOrFail(id);
    if (payroll.status === PayrollStatus.INACTIVE) {
      return PayrollResourceDto.fromEntity(payroll);
    }
    assertPayrollAction(payroll, PayrollAction.DEACTIVATE);
    payroll.status = PayrollStatus.INACTIVE;
    return PayrollResourceDto.fromEntity(await this.payrolls.save(payroll));
  }

  private async findOneOrFail(id: string): Promise<Payroll> {
    const payroll = await this.payrolls.findOneBy({ id });
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
