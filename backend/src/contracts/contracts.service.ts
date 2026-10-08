import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContractDto } from './dto/create-contract.dto.js';
import {
  ContractSortField,
  FindContractsQueryDto,
} from './dto/find-contracts-query.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';
import {
  Contract,
  ContractStatus,
  ContractType,
} from './entities/contract.entity.js';
import { Employee } from '#employees/entities/employee.entity.js';
import { ContractResourceDto } from './dto/contract-resource.dto.js';
import { PaginatedContractsResponseDto } from './dto/paginated-contracts-resource.dto.js';
import { ContractTypeDto } from './dto/contract-type.dto.js';
import { PaginationMetaDto } from '#common/dto/pagination.dto.js';

/** Wire `sort_by` values (snake_case) mapped to entity columns. */
const CONTRACT_SORT_COLUMNS: Record<ContractSortField, string> = {
  start_date: 'startDate',
  end_date: 'endDate',
  signed_date: 'signedDate',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contracts: Repository<Contract>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
  ) {}

  async create(
    createContractDto: CreateContractDto,
  ): Promise<ContractResourceDto> {
    const employee = await this.employees.findOneBy({
      id: createContractDto.employeeId,
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee #${createContractDto.employeeId} not found`,
      );
    }

    const startDate = new Date(createContractDto.startDate);
    const endDate = createContractDto.endDate
      ? new Date(createContractDto.endDate)
      : null;
    this.throwIfEndDateBeforeStart(startDate, endDate);
    await this.validateNoOverlap(
      createContractDto.employeeId,
      startDate,
      endDate,
    );

    const contract = this.contracts.create({
      employeeId: createContractDto.employeeId,
      type: createContractDto.type,
      title: createContractDto.title,
      startDate,
      endDate,
      signedDate: null,
      status: ContractStatus.PENDING,
    });

    return ContractResourceDto.fromEntity(await this.contracts.save(contract));
  }

  async findAll(
    query: FindContractsQueryDto,
  ): Promise<PaginatedContractsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = CONTRACT_SORT_COLUMNS[query.sortBy ?? 'created_at'];
    const order = query.order ?? 'DESC';

    const queryBuilder = this.contracts.createQueryBuilder('contract');

    if (query.employeeId) {
      queryBuilder.andWhere('contract.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('contract.status = :status', {
        status: query.status,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('contract.type = :type', {
        type: query.type,
      });
    }

    queryBuilder
      .orderBy(`contract.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [contracts, total] = await queryBuilder.getManyAndCount();

    const response = new PaginatedContractsResponseDto();
    response.data = contracts.map((contract) =>
      ContractResourceDto.fromEntity(contract),
    );
    response.meta = PaginationMetaDto.fromTotal(total, page, limit);
    return response;
  }

  async findOne(id: string): Promise<ContractResourceDto> {
    return ContractResourceDto.fromEntity(await this.findOneOrFail(id));
  }

  getTypes(): ContractTypeDto[] {
    return Object.values(ContractType).map((value) =>
      ContractTypeDto.fromValue(value),
    );
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
  ): Promise<ContractResourceDto> {
    const contract = await this.findOneOrFail(id);
    this.throwIfNotPending(contract, 'update');

    const startDate =
      updateContractDto.startDate !== undefined
        ? new Date(updateContractDto.startDate)
        : contract.startDate;
    const endDate =
      updateContractDto.endDate !== undefined
        ? new Date(updateContractDto.endDate)
        : contract.endDate;
    this.throwIfEndDateBeforeStart(startDate, endDate);
    await this.validateNoOverlap(
      contract.employeeId,
      startDate,
      endDate,
      contract.id,
    );

    const merged = this.contracts.merge(contract, {
      ...(updateContractDto.type !== undefined
        ? { type: updateContractDto.type }
        : {}),
      ...(updateContractDto.title !== undefined
        ? { title: updateContractDto.title }
        : {}),
      ...(updateContractDto.startDate !== undefined ? { startDate } : {}),
      ...(updateContractDto.endDate !== undefined ? { endDate } : {}),
    });
    return ContractResourceDto.fromEntity(await this.contracts.save(merged));
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOneOrFail(id);
    // Signed contracts are immutable records: they leave the system only
    // through the employee cascade, never through a direct delete.
    if (contract.status === ContractStatus.SIGNED) {
      throw new ConflictException(
        `Cannot remove contract #${contract.id} with status '${contract.status}'`,
      );
    }
    await this.contracts.softRemove(contract);
  }

  async restore(id: string): Promise<ContractResourceDto> {
    const contract = await this.contracts.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!contract) {
      throw new NotFoundException(`Contract #${id} not found`);
    }
    if (!contract.deletedAt) {
      return ContractResourceDto.fromEntity(contract);
    }
    await this.validateNoOverlap(
      contract.employeeId,
      contract.startDate,
      contract.endDate,
      contract.id,
    );
    return ContractResourceDto.fromEntity(
      await this.contracts.recover(contract),
    );
  }

  async sign(
    id: string,
    signContractDto: SignContractDto = {},
  ): Promise<ContractResourceDto> {
    const contract = await this.findOneOrFail(id);
    if (contract.status === ContractStatus.SIGNED) {
      return ContractResourceDto.fromEntity(contract);
    }
    this.throwIfNotPending(contract, 'sign');
    contract.status = ContractStatus.SIGNED;
    contract.signedDate = signContractDto.signedDate
      ? new Date(signContractDto.signedDate)
      : new Date();
    return ContractResourceDto.fromEntity(await this.contracts.save(contract));
  }

  async decline(id: string): Promise<ContractResourceDto> {
    const contract = await this.findOneOrFail(id);
    if (contract.status === ContractStatus.DECLINED) {
      return ContractResourceDto.fromEntity(contract);
    }
    this.throwIfNotPending(contract, 'decline');
    contract.status = ContractStatus.DECLINED;
    return ContractResourceDto.fromEntity(await this.contracts.save(contract));
  }

  async void(id: string): Promise<ContractResourceDto> {
    const contract = await this.findOneOrFail(id);
    if (contract.status === ContractStatus.VOIDED) {
      return ContractResourceDto.fromEntity(contract);
    }
    if (contract.status !== ContractStatus.SIGNED) {
      throw new ConflictException(
        `Cannot void contract #${contract.id} with status '${contract.status}'`,
      );
    }
    contract.status = ContractStatus.VOIDED;
    return ContractResourceDto.fromEntity(await this.contracts.save(contract));
  }

  private async findOneOrFail(id: string): Promise<Contract> {
    const contract = await this.contracts.findOneBy({ id });
    if (!contract) {
      throw new NotFoundException(`Contract #${id} not found`);
    }
    return contract;
  }

  private throwIfNotPending(contract: Contract, action: string): void {
    if (contract.status !== ContractStatus.PENDING) {
      throw new ConflictException(
        `Cannot ${action} contract #${contract.id} with status '${contract.status}'`,
      );
    }
  }

  private throwIfEndDateBeforeStart(
    startDate: Date,
    endDate: Date | null,
  ): void {
    if (endDate && endDate < startDate) {
      throw new BadRequestException('end_date must be on or after start_date');
    }
  }

  /**
   * Rejects date ranges that overlap another live contract of the same
   * employee. Soft-deleted, `declined`, and `voided` records are ignored —
   * a `null` end date means open-ended. `excludeId` skips the contract
   * being updated or restored.
   */
  private async validateNoOverlap(
    employeeId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.contracts.createQueryBuilder('contract');
    queryBuilder
      .where('contract.employeeId = :employeeId', { employeeId })
      .andWhere('contract.status IN (:...statuses)', {
        statuses: [ContractStatus.PENDING, ContractStatus.SIGNED],
      })
      .andWhere(
        '(contract.endDate IS NULL OR contract.endDate >= :startDate)',
        {
          startDate,
        },
      );
    if (endDate) {
      queryBuilder.andWhere('contract.startDate <= :endDate', { endDate });
    }
    if (excludeId) {
      queryBuilder.andWhere('contract.id != :excludeId', { excludeId });
    }
    // Soft-deleted rows are excluded by the default scope.
    const existing = await queryBuilder.getOne();
    if (existing) {
      throw new ConflictException(
        `Employee #${employeeId} already has a contract (#${existing.id}) overlapping the given dates`,
      );
    }
  }
}
