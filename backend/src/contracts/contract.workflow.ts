import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { ContractStatus } from './entities/contract.entity.js';

/**
 * Single place that defines the contract status flow.
 * Mirrors current service behavior (no guard changes): sign /
 * decline / update / delete are pending-only, void is signed-only.
 * `sign` accepts an optional `signed_date`, flagged via
 * `requiresInput` so the frontend knows to prompt for it.
 */
export const ContractWorkflow = {
  places: [
    ContractStatus.PENDING,
    ContractStatus.SIGNED,
    ContractStatus.DECLINED,
    ContractStatus.VOIDED,
  ],
} as const;

export function getContractActions(
  status: ContractStatus,
  id: string,
): ActionLinkDto[] {
  switch (status) {
    case ContractStatus.PENDING:
      return [
        new ActionLinkDto(
          'sign',
          'PATCH',
          `/contracts/${id}/sign`,
          'Sign',
          'signed_date',
        ),
        new ActionLinkDto(
          'decline',
          'PATCH',
          `/contracts/${id}/decline`,
          'Decline',
        ),
        new ActionLinkDto('update', 'PATCH', `/contracts/${id}`, 'Edit'),
        new ActionLinkDto('delete', 'DELETE', `/contracts/${id}`, 'Delete'),
      ];
    case ContractStatus.SIGNED:
      return [
        new ActionLinkDto('void', 'PATCH', `/contracts/${id}/void`, 'Void'),
      ];
    case ContractStatus.DECLINED:
    case ContractStatus.VOIDED:
      return [];
    default:
      return [];
  }
}
