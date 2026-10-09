import { PayrollStatus } from './entities/payroll.entity.js';
import { getPayrollActions } from './payroll.workflow.js';

describe('getPayrollActions', () => {
  const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';

  it('exposes deactivate, update, and delete for an active payroll', () => {
    expect(getPayrollActions(PayrollStatus.ACTIVE, id)).toEqual([
      {
        id: 'deactivate',
        method: 'PATCH',
        href: `/payrolls/${id}/deactivate`,
        label: 'Deactivate',
      },
      { id: 'update', method: 'PATCH', href: `/payrolls/${id}`, label: 'Edit' },
      {
        id: 'delete',
        method: 'DELETE',
        href: `/payrolls/${id}`,
        label: 'Delete',
      },
    ]);
  });

  it('exposes activate, update, and delete for an inactive payroll', () => {
    expect(getPayrollActions(PayrollStatus.INACTIVE, id)).toEqual([
      {
        id: 'activate',
        method: 'PATCH',
        href: `/payrolls/${id}/activate`,
        label: 'Activate',
      },
      { id: 'update', method: 'PATCH', href: `/payrolls/${id}`, label: 'Edit' },
      {
        id: 'delete',
        method: 'DELETE',
        href: `/payrolls/${id}`,
        label: 'Delete',
      },
    ]);
  });
});
