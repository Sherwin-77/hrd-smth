import { ActionLinkDto } from '#common/dto/action-link.dto.js';
import { PayrollStatus } from './entities/payroll.entity.js';

/**
 * Single place that defines the payroll status flow.
 * `places` mirrors `PayrollStatus`; each transition declares which
 * `from` places expose it. Adding a status only touches this file
 * (plus the entity enum) — services, controllers, and the frontend
 * read from here for visibility.
 *
 * Mirrors current service behavior (no guard changes): update and
 * delete stay available from every live place.
 */
export const PayrollWorkflow = {
  places: [PayrollStatus.ACTIVE, PayrollStatus.INACTIVE],
} as const;

export function getPayrollActions(
  status: PayrollStatus,
  id: string,
): ActionLinkDto[] {
  switch (status) {
    case PayrollStatus.ACTIVE:
      return [
        new ActionLinkDto(
          'deactivate',
          'PATCH',
          `/payrolls/${id}/deactivate`,
          'Deactivate',
        ),
        new ActionLinkDto('update', 'PATCH', `/payrolls/${id}`, 'Edit'),
        new ActionLinkDto('delete', 'DELETE', `/payrolls/${id}`, 'Delete'),
      ];
    case PayrollStatus.INACTIVE:
      return [
        new ActionLinkDto(
          'activate',
          'PATCH',
          `/payrolls/${id}/activate`,
          'Activate',
        ),
        new ActionLinkDto('update', 'PATCH', `/payrolls/${id}`, 'Edit'),
        new ActionLinkDto('delete', 'DELETE', `/payrolls/${id}`, 'Delete'),
      ];
    default:
      return [];
  }
}
