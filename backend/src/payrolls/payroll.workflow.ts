import { ConflictException } from '@nestjs/common';
import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';

export const PayrollAction = {
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type PayrollAction = (typeof PayrollAction)[keyof typeof PayrollAction];

interface PayrollTransition {
  id: PayrollAction;
  from: PayrollStatus[];
  method: 'PATCH' | 'DELETE';
  path: (id: string) => string;
  label: string;
}

/**
 * Single place that defines the payroll status flow.
 * Each transition declares which `from` statuses expose it. Adding a
 * status only touches this file (plus the entity enum) — services
 * guard through `assertPayrollAction` and resource DTOs expose
 * visibility through `getPayrollActions`, so both stay in sync with
 * no other edits.
 */
const PAYROLL_TRANSITIONS: PayrollTransition[] = [
  {
    id: PayrollAction.ACTIVATE,
    from: [PayrollStatus.INACTIVE],
    method: 'PATCH',
    path: (id) => `/payrolls/${id}/activate`,
    label: 'Activate',
  },
  {
    id: PayrollAction.DEACTIVATE,
    from: [PayrollStatus.ACTIVE],
    method: 'PATCH',
    path: (id) => `/payrolls/${id}/deactivate`,
    label: 'Deactivate',
  },
  {
    id: PayrollAction.UPDATE,
    from: [PayrollStatus.ACTIVE, PayrollStatus.INACTIVE],
    method: 'PATCH',
    path: (id) => `/payrolls/${id}`,
    label: 'Edit',
  },
  {
    id: PayrollAction.DELETE,
    from: [PayrollStatus.INACTIVE],
    method: 'DELETE',
    path: (id) => `/payrolls/${id}`,
    label: 'Delete',
  },
];

export function canPayrollAction(
  status: PayrollStatus,
  action: PayrollAction,
): boolean {
  return PAYROLL_TRANSITIONS.some(
    (transition) =>
      transition.id === action && transition.from.includes(status),
  );
}

export function assertPayrollAction(
  payroll: Payroll,
  action: PayrollAction,
): void {
  if (!canPayrollAction(payroll.status, action)) {
    throw new ConflictException(
      `Cannot ${action} payroll #${payroll.id} with status '${payroll.status}'`,
    );
  }
}

export function getPayrollActions(
  status: PayrollStatus,
  id: string,
): ActionLinkDto[] {
  return PAYROLL_TRANSITIONS.filter((transition) =>
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
