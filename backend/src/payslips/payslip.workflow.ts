import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { PayslipStatus } from './entities/payslip.entity.js';

/**
 * Single place that defines the payslip status flow.
 * Mirrors current service behavior (no guard changes): approve /
 * reject / update are pending-only, while delete stays available
 * from every place (current `remove()` has no status guard).
 * Tightening delete to pending-only is a separate change.
 */
export const PayslipWorkflow = {
  places: [
    PayslipStatus.PENDING,
    PayslipStatus.APPROVED,
    PayslipStatus.REJECTED,
  ],
} as const;

export function getPayslipActions(
  status: PayslipStatus,
  id: string,
): ActionLinkDto[] {
  switch (status) {
    case PayslipStatus.PENDING:
      return [
        new ActionLinkDto(
          'approve',
          'PATCH',
          `/payslips/${id}/approve`,
          'Approve',
        ),
        new ActionLinkDto('reject', 'PATCH', `/payslips/${id}/reject`, 'Reject'),
        new ActionLinkDto('update', 'PATCH', `/payslips/${id}`, 'Edit'),
        new ActionLinkDto('delete', 'DELETE', `/payslips/${id}`, 'Delete'),
      ];
    case PayslipStatus.APPROVED:
    case PayslipStatus.REJECTED:
      return [new ActionLinkDto('delete', 'DELETE', `/payslips/${id}`, 'Delete')];
    default:
      return [];
  }
}
