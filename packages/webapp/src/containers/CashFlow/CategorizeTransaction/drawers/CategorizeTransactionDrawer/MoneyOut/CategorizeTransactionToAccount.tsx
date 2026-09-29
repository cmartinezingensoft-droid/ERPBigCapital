import { Position } from '@blueprintjs/core';
import React from 'react';
import { useCategorizeTransactionBoot } from '../CategorizeTransactionBoot';
import { CategorizeTransactionBranchField } from '../CategorizeTransactionBranchField';
import {
  AccountsSelect,
  FDateInput,
  FFormGroup,
  FInputGroup,
  FTextArea,
  Icon,
} from '@/components';
import { useDateInputFormatter } from '@/hooks';

export function CategorizeTransactionToAccount() {
  const { accounts } = useCategorizeTransactionBoot();
  const dateInputFormatter = useDateInputFormatter();

  if (!accounts) {
    return null;
  }
  return (
    <>
      <FFormGroup name={'date'} label={'Fecha'} fastField inline>
        <FDateInput
          name={'date'}
          popoverProps={{ position: Position.BOTTOM, minimal: true }}
          {...dateInputFormatter}
          inputProps={{ fill: true, leftElement: <Icon icon={'date-range'} /> }}
        />
      </FFormGroup>

      <FFormGroup
        name={'debitAccountId'}
        label={'Desde la cuenta'}
        fastField
        inline
      >
        <AccountsSelect
          name={'debitAccountId'}
          items={accounts}
          fastField
          fill
          allowCreate
          disabled
        />
      </FFormGroup>

      <FFormGroup
        name={'creditAccountId'}
        label={'A la cuenta'}
        fastField
        inline
      >
        <AccountsSelect
          name={'creditAccountId'}
          items={accounts}
          filterByRootTypes={['asset']}
          fastField
          fill
          allowCreate
        />
      </FFormGroup>

      <FFormGroup name={'referenceNo'} label={'N.º de referencia'} fastField inline>
        <FInputGroup name={'referenceNo'} fill />
      </FFormGroup>

      <FFormGroup name={'description'} label={'Descripción'} fastField inline>
        <FTextArea
          name={'description'}
          growVertically={true}
          large={true}
          fill={true}
        />
      </FFormGroup>

      <CategorizeTransactionBranchField />
    </>
  );
}
