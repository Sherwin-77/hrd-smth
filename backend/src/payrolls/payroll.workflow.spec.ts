import { ConflictException } from '@nestjs/common';
import { Payroll, PayrollStatus } from './entities/payroll.entity.js';
import {
  assertPayrollAction,
  canPayrollAction,
  getPayrollActions,
  PayrollAction,
} from './payroll.workflow.js';

describe('getPayrollActions', () => {
  const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';

  it('exposes deactivate and update for an active payroll', () => {
    expect(getPayrollActions(PayrollStatus.ACTIVE, id)).toEqual([
      {
        id: 'deactivate',
        method: 'PATCH',
        href: `/payrolls/${id}/deactivate`,
        label: 'Deactivate',
      },
      { id: 'update', method: 'PATCH', href: `/payrolls/${id}`, label: 'Edit' },
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

  it('guards match visibility: allowed actions pass, others throw', () => {
    const active = { id, status: PayrollStatus.ACTIVE } as Payroll;
    const inactive = { id, status: PayrollStatus.INACTIVE } as Payroll;
    expect(
      canPayrollAction(PayrollStatus.ACTIVE, PayrollAction.DEACTIVATE),
    ).toBe(true);
    expect(canPayrollAction(PayrollStatus.ACTIVE, PayrollAction.ACTIVATE)).toBe(
      false,
    );
    expect(() =>
      assertPayrollAction(active, PayrollAction.UPDATE),
    ).not.toThrow();
    expect(() => assertPayrollAction(active, PayrollAction.ACTIVATE)).toThrow(
      ConflictException,
    );
    expect(() =>
      assertPayrollAction(inactive, PayrollAction.DEACTIVATE),
    ).toThrow(ConflictException);
    expect(() => assertPayrollAction(active, PayrollAction.DELETE)).toThrow(
      ConflictException,
    );
    expect(() =>
      assertPayrollAction(inactive, PayrollAction.DELETE),
    ).not.toThrow();
  });
});
