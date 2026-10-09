import { ConflictException } from '@nestjs/common';
import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { Payslip, PayslipStatus } from './entities/payslip.entity.js';

export const PayslipAction = {
  APPROVE: 'approve',
  REJECT: 'reject',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type PayslipAction = (typeof PayslipAction)[keyof typeof PayslipAction];

interface PayslipTransition {
  id: PayslipAction;
  from: PayslipStatus[];
  method: 'PATCH' | 'DELETE';
  path: (id: string) => string;
  label: string;
}

/**
 * Single place that defines the payslip status flow.
 * Services guard through `assertPayslipAction` and resource DTOs
 * expose visibility through `getPayslipActions`, so both stay in
 * sync with no other edits.
 */
const PAYSLIP_TRANSITIONS: PayslipTransition[] = [
  {
    id: PayslipAction.APPROVE,
    from: [PayslipStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/payslips/${id}/approve`,
    label: 'Approve',
  },
  {
    id: PayslipAction.REJECT,
    from: [PayslipStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/payslips/${id}/reject`,
    label: 'Reject',
  },
  {
    id: PayslipAction.UPDATE,
    from: [PayslipStatus.PENDING],
    method: 'PATCH',
    path: (id) => `/payslips/${id}`,
    label: 'Edit',
  },
  {
    id: PayslipAction.DELETE,
    from: [PayslipStatus.PENDING],
    method: 'DELETE',
    path: (id) => `/payslips/${id}`,
    label: 'Delete',
  },
];

export function canPayslipAction(
  status: PayslipStatus,
  action: PayslipAction,
): boolean {
  return PAYSLIP_TRANSITIONS.some(
    (transition) =>
      transition.id === action && transition.from.includes(status),
  );
}

export function assertPayslipAction(
  payslip: Payslip,
  action: PayslipAction,
): void {
  if (!canPayslipAction(payslip.status, action)) {
    throw new ConflictException(
      `Cannot ${action} payslip #${payslip.id} with status '${payslip.status}'`,
    );
  }
}

export function getPayslipActions(
  status: PayslipStatus,
  id: string,
): ActionLinkDto[] {
  return PAYSLIP_TRANSITIONS.filter((transition) =>
    transition.from.includes(status),
  ).map(
    (transition) =>
      new ActionLinkDto(
        transition.id,
        transition.method,
        transition.path(id),
        transition.label,
      ),
  );
}
