import { ContractStatus } from './entities/contract.entity.js';
import { getContractActions } from './contract.workflow.js';

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
});
