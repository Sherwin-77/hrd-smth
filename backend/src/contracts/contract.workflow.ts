import { ConflictException } from '@nestjs/common';
import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { Contract, ContractStatus } from './entities/contract.entity.js';

export const ContractAction = {
  SIGN: 'sign',
  DECLINE: 'decline',
  UPDATE: 'update',
  DELETE: 'delete',
  VOID: 'void',
} as const;

export type ContractAction =
  (typeof ContractAction)[keyof typeof ContractAction];

interface ContractTransition {
  id: ContractAction;
  from: ContractStatus[];
  method: 'PATCH' | 'DELETE';
  path: (id: string) => string;
  label: string;
  requiresInput?: string;
}

/**
 * Single place that defines the contract status flow.
 * Services guard through `assertContractAction` and resource DTOs
 * expose visibility through `getContractActions`, so both stay in
 * sync with no other edits. `sign` accepts an optional `signed_date`,
 * flagged via `requiresInput` so the frontend knows to prompt for it.
 */
const CONTRACT_TRANSITIONS: ContractTransition[] = [
  {
    id: ContractAction.SIGN,
    from: [ContractStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/contracts/${id}/sign`,
    label: 'Sign',
    requiresInput: 'signed_date',
  },
  {
    id: ContractAction.DECLINE,
    from: [ContractStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/contracts/${id}/decline`,
    label: 'Decline',
  },
  {
    id: ContractAction.UPDATE,
    from: [ContractStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/contracts/${id}`,
    label: 'Edit',
  },
  {
    id: ContractAction.DELETE,
    from: [ContractStatus.PENDING],
    method: 'DELETE',
    path: (id) => `/contracts/${id}`,
    label: 'Delete',
  },
  {
    id: ContractAction.VOID,
    from: [ContractStatus.SIGNED],
    method: 'PATCH',
    path: (id) => `/contracts/${id}/void`,
    label: 'Void',
  },
];

export function canContractAction(
  status: ContractStatus,
  action: ContractAction,
): boolean {
  return CONTRACT_TRANSITIONS.some(
    (transition) =>
      transition.id === action && transition.from.includes(status),
  );
}

export function assertContractAction(
  contract: Contract,
  action: ContractAction,
): void {
  if (!canContractAction(contract.status, action)) {
    throw new ConflictException(
      `Cannot ${action} contract #${contract.id} with status '${contract.status}'`,
    );
  }
}

export function getContractActions(
  status: ContractStatus,
  id: string,
): ActionLinkDto[] {
  return CONTRACT_TRANSITIONS.filter((transition) =>
    transition.from.includes(status),
  ).map(
    (transition) =>
      new ActionLinkDto(
        transition.id,
        transition.method,
        transition.path(id),
        transition.label,
        transition.requiresInput,
      ),
  );
}
