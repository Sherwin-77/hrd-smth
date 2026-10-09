import { Expose, Type } from 'class-transformer';
import {
  Contract,
  ContractStatus,
  ContractType,
} from '#contracts/entities/contract.entity.js';
import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { getContractActions } from '#contracts/contract.workflow.js';

/**
 * Wire format is snake_case (via `@Expose` + global
 * `ClassSerializerInterceptor`); TypeScript names stay camelCase.
 */
export class ContractResourceDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'employee_id' })
  employeeId: string;

  @Expose({ name: 'type' })
  type: ContractType;

  @Expose({ name: 'title' })
  title: string;

  @Expose({ name: 'start_date' })
  startDate: Date;

  @Expose({ name: 'end_date' })
  endDate: Date | null;

  @Expose({ name: 'signed_date' })
  signedDate: Date | null;

  @Expose({ name: 'status' })
  status: ContractStatus;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @Expose({ name: 'available_actions' })
  @Type(() => ActionLinkDto)
  availableActions: ActionLinkDto[];

  static fromEntity(contract: Contract): ContractResourceDto {
    const resource = new ContractResourceDto();
    resource.id = contract.id;
    resource.employeeId = contract.employeeId;
    resource.type = contract.type;
    resource.title = contract.title;
    resource.startDate = contract.startDate;
    resource.endDate = contract.endDate;
    resource.signedDate = contract.signedDate;
    resource.status = contract.status;
    resource.createdAt = contract.createdAt;
    resource.updatedAt = contract.updatedAt;
    resource.availableActions = getContractActions(
      contract.status,
      contract.id,
    );
    return resource;
  }
}
