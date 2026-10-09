import { ConflictException } from '@nestjs/common';
import { Payslip, PayslipStatus } from './entities/payslip.entity.js';
import {
  assertPayslipAction,
  canPayslipAction,
  getPayslipActions,
  PayslipAction,
} from './payslip.workflow.js';

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
    'exposes nothing for a %s payslip',
    (status) => {
      expect(getPayslipActions(status, id)).toEqual([]);
    },
  );

  it('guards match visibility: allowed actions pass, others throw', () => {
    const pending = { id, status: PayslipStatus.PENDING } as Payslip;
    const approved = { id, status: PayslipStatus.APPROVED } as Payslip;
    expect(canPayslipAction(PayslipStatus.PENDING, PayslipAction.APPROVE)).toBe(
      true,
    );
    expect(
      canPayslipAction(PayslipStatus.APPROVED, PayslipAction.APPROVE),
    ).toBe(false);
    expect(() =>
      assertPayslipAction(pending, PayslipAction.UPDATE),
    ).not.toThrow();
    expect(() => assertPayslipAction(approved, PayslipAction.UPDATE)).toThrow(
      ConflictException,
    );
    expect(() =>
      assertPayslipAction(pending, PayslipAction.DELETE),
    ).not.toThrow();
    expect(() => assertPayslipAction(approved, PayslipAction.DELETE)).toThrow(
      ConflictException,
    );
  });
});
