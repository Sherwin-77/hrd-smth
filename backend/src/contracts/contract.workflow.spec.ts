import { ConflictException } from '@nestjs/common';
import { Contract, ContractStatus } from './entities/contract.entity.js';
import {
  assertContractAction,
  canContractAction,
  ContractAction,
  getContractActions,
} from './contract.workflow.js';

describe('getContractActions', () => {
  const id = '0193e5e0-9f6a-7a1b-9c2d-4e5f6a7b8c9e';

  it('exposes sign, decline, update, and delete for a pending contract', () => {
    expect(getContractActions(ContractStatus.PENDING, id)).toEqual([
      {
        id: 'sign',
        method: 'PATCH',
        href: `/contracts/${id}/sign`,
        label: 'Sign',
        requiresInput: 'signed_date',
      },
      {
        id: 'decline',
        method: 'PATCH',
        href: `/contracts/${id}/decline`,
        label: 'Decline',
      },
      { id: 'update', method: 'PATCH', href: `/contracts/${id}`, label: 'Edit' },
      {
        id: 'delete',
        method: 'DELETE',
        href: `/contracts/${id}`,
        label: 'Delete',
      },
    ]);
  });

  it('exposes only void for a signed contract', () => {
    expect(getContractActions(ContractStatus.SIGNED, id)).toEqual([
      {
        id: 'void',
        method: 'PATCH',
        href: `/contracts/${id}/void`,
        label: 'Void',
      },
    ]);
  });

  it.each([ContractStatus.DECLINED, ContractStatus.VOIDED])(
    'exposes nothing for a %s contract',
    (status) => {
      expect(getContractActions(status, id)).toEqual([]);
    },
  );

  it('guards match visibility: allowed actions pass, others throw', () => {
    const pending = { id, status: ContractStatus.PENDING } as Contract;
    const signed = { id, status: ContractStatus.SIGNED } as Contract;
    expect(canContractAction(ContractStatus.SIGNED, ContractAction.VOID)).toBe(
      true,
    );
    expect(canContractAction(ContractStatus.PENDING, ContractAction.VOID)).toBe(
      false,
    );
    expect(() =>
      assertContractAction(pending, ContractAction.SIGN),
    ).not.toThrow();
    expect(() =>
      assertContractAction(pending, ContractAction.VOID),
    ).toThrow(ConflictException);
    expect(() =>
      assertContractAction(signed, ContractAction.DELETE),
    ).toThrow(ConflictException);
  });
});
