import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { FindPayslipsQueryDto } from './dto/find-payslips-query.dto.js';
import { UpdatePayslipDto } from './dto/update-payslip.dto.js';
import { Payslip, PayslipStatus } from './entities/payslip.entity.js';
import { Payroll } from '#payrolls/entities/payroll.entity.js';
import { PayslipResourceDto } from './dto/payslip-resource.dto.js';

export interface PaginatedPayslips {
  data: PayslipResourceDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PayslipsService {
  constructor(
    @InjectRepository(Payslip)
    private readonly payslips: Repository<Payslip>,
    @InjectRepository(Payroll)
    private readonly payrolls: Repository<Payroll>,
  ) {}

  async create(
    createPayslipDto: CreatePayslipDto,
  ): Promise<PayslipResourceDto> {
    const payroll = await this.payrolls.findOneBy({
      id: createPayslipDto.payrollId,
    });
    if (!payroll) {
      throw new NotFoundException(
        `Payroll #${createPayslipDto.payrollId} not found`,
      );
    }

    const payslip = this.payslips.create({
      employeeId: payroll.employeeId,
      payrollId: createPayslipDto.payrollId,
      basicSalary: createPayslipDto.basicSalary,
      overtime: createPayslipDto.overtime ?? 0,
      tax: createPayslipDto.tax ?? 0,
      bonus: createPayslipDto.bonus ?? 0,
      deduction: createPayslipDto.deduction ?? 0,
      date: new Date(createPayslipDto.date),
      status: PayslipStatus.PENDING,
    });

    return PayslipResourceDto.fromEntity(await this.payslips.save(payslip));
  }

  async findAll(query: FindPayslipsQueryDto): Promise<PaginatedPayslips> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const queryBuilder = this.payslips.createQueryBuilder('payslip');

    if (query.employeeId) {
      queryBuilder.andWhere('payslip.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    if (query.payrollId) {
      queryBuilder.andWhere('payslip.payrollId = :payrollId', {
        payrollId: query.payrollId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('payslip.status = :status', {
        status: query.status,
      });
    }

    queryBuilder
      .orderBy(`payslip.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [payslips, total] = await queryBuilder.getManyAndCount();

    return {
      data: payslips.map((payslip) => PayslipResourceDto.fromEntity(payslip)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<PayslipResourceDto> {
    return this.findOneOrFail(id);
  }

  async update(
    id: string,
    updatePayslipDto: UpdatePayslipDto,
  ): Promise<PayslipResourceDto> {
    const payslip = await this.findOneOrFail(id);
    this.throwIfNotPending(payslip, 'update');

    const merged = this.payslips.merge(payslip, {
      ...(updatePayslipDto.basicSalary !== undefined
        ? { basicSalary: updatePayslipDto.basicSalary }
        : {}),
      ...(updatePayslipDto.overtime !== undefined
        ? { overtime: updatePayslipDto.overtime }
        : {}),
      ...(updatePayslipDto.tax !== undefined
        ? { tax: updatePayslipDto.tax }
        : {}),
      ...(updatePayslipDto.bonus !== undefined
        ? { bonus: updatePayslipDto.bonus }
        : {}),
      ...(updatePayslipDto.deduction !== undefined
        ? { deduction: updatePayslipDto.deduction }
        : {}),
      ...(updatePayslipDto.date !== undefined
        ? { date: new Date(updatePayslipDto.date) }
        : {}),
    });
    return PayslipResourceDto.fromEntity(await this.payslips.save(merged));
  }

  async remove(id: string): Promise<void> {
    const payslip = await this.findOneOrFail(id);
    await this.payslips.softRemove(payslip);
  }

  async restore(id: string): Promise<PayslipResourceDto> {
    const payslip = await this.payslips.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!payslip) {
      throw new NotFoundException(`Payslip #${id} not found`);
    }
    if (!payslip.deletedAt) {
      return PayslipResourceDto.fromEntity(payslip);
    }
    return PayslipResourceDto.fromEntity(await this.payslips.recover(payslip));
  }

  async approve(id: string): Promise<PayslipResourceDto> {
    const payslip = await this.findOneOrFail(id);
    if (payslip.status === PayslipStatus.APPROVED) {
      return payslip;
    }
    this.throwIfNotPending(payslip, 'approve');
    payslip.status = PayslipStatus.APPROVED;
    return PayslipResourceDto.fromEntity(await this.payslips.save(payslip));
  }

  async reject(id: string): Promise<PayslipResourceDto> {
    const payslip = await this.findOneOrFail(id);
    if (payslip.status === PayslipStatus.REJECTED) {
      return payslip;
    }
    this.throwIfNotPending(payslip, 'reject');
    payslip.status = PayslipStatus.REJECTED;
    return PayslipResourceDto.fromEntity(await this.payslips.save(payslip));
  }

  private async findOneOrFail(id: string): Promise<Payslip> {
    const payslip = await this.payslips.findOneBy({ id });
    if (!payslip) {
      throw new NotFoundException(`Payslip #${id} not found`);
    }
    return payslip;
  }

  private throwIfNotPending(payslip: Payslip, action: string): void {
    if (payslip.status !== PayslipStatus.PENDING) {
      throw new ConflictException(
        `Cannot ${action} payslip #${payslip.id} with status '${payslip.status}'`,
      );
    }
  }
}
