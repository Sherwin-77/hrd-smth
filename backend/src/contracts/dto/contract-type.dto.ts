import { Expose } from 'class-transformer';
import { ContractType } from '#contracts/entities/contract.entity.js';

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.PERMANENT]: 'Permanent',
  [ContractType.FIXED_TIME]: 'Fixed time',
};

/**
 * Reference data for contract `type` dropdowns. Wire format is snake_case
 * (via `@Expose` + global `ClassSerializerInterceptor`); TypeScript names
 * stay camelCase.
 */
export class ContractTypeDto {
  @Expose({ name: 'value' })
  value: ContractType;

  @Expose({ name: 'label' })
  label: string;

  static fromValue(value: ContractType): ContractTypeDto {
    const dto = new ContractTypeDto();
    dto.value = value;
    dto.label = CONTRACT_TYPE_LABELS[value];
    return dto;
  }
}
