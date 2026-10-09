import { PayslipStatus } from './entities/payslip.entity.js';
import { getPayslipActions } from './payslip.workflow.js';

describe('getPayslipActions', () => {
  const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';

  it('exposes approve, reject, update, and delete for a pending payslip', () => {
    expect(getPayslipActions(PayslipStatus.PENDING, id)).toEqual([
      {
        id: 'approve',
        method: 'PATCH',
        href: `/payslips/${id}/approve`,
        label: 'Approve',
      },
      {
        id: 'reject',
        method: 'PATCH',
        href: `/payslips/${id}/reject`,
        label: 'Reject',
      },
      { id: 'update', method: 'PATCH', href: `/payslips/${id}`, label: 'Edit' },
      {
        id: 'delete',
        method: 'DELETE',
        href: `/payslips/${id}`,
        label: 'Delete',
      },
    ]);
  });

  it.each([PayslipStatus.APPROVED, PayslipStatus.REJECTED])(
    'exposes only delete for a %s payslip',
    (status) => {
      expect(getPayslipActions(status, id)).toEqual([
        {
          id: 'delete',
          method: 'DELETE',
          href: `/payslips/${id}`,
          label: 'Delete',
        },
      ]);
    },
  );
});
