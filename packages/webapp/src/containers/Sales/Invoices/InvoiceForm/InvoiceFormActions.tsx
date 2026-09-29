import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';
import { InclusiveButtonOptions } from './constants';
import { composeEntriesOnEditInclusiveTax } from './utils';
import type { InvoiceFormValues } from './utils';
import { FFormGroup, FSelect } from '@/components';
import { EntriesActionsBar } from '@/containers/Entries/EntriesActionBar';
import { TaxType } from '@/interfaces/TaxRates';

/**
 * Invoice form actions.
 * @returns {React.ReactNode}
 */
const AeatInvoiceTypeOptions = [
  { key: 'F1', label: 'F1 · Factura completa' },
  { key: 'F2', label: 'F2 · Factura simplificada' },
] as const;

export function InvoiceFormActions() {
  return (
    <EntriesActionsBar>
      <FFormGroup name={'aeatInvoiceType'} label={'Tipo AEAT'} inline={true}>
        <FSelect
          name={'aeatInvoiceType'}
          items={AeatInvoiceTypeOptions as any}
          textAccessor={'label'}
          labelAccessor={() => ''}
          valueAccessor={'key'}
          popoverProps={{ minimal: true, usePortal: true, inline: false }}
          buttonProps={{ small: true }}
          filterable={false}
        />
      </FFormGroup>
      <InvoiceExclusiveInclusiveSelect />
    </EntriesActionsBar>
  );
}

/**
 * Invoice exclusive/inclusive select.
 * @returns {React.ReactNode}
 */
export function InvoiceExclusiveInclusiveSelect(
  props: React.ComponentProps<typeof FSelect>,
) {
  const { values, setFieldValue } = useFormikContext<InvoiceFormValues>();

  const handleItemSelect = (item: { key: TaxType }) => {
    const newEntries = composeEntriesOnEditInclusiveTax(
      item.key,
      values.entries,
    );
    setFieldValue('inclusiveExclusiveTax', item.key);
    setFieldValue('entries', newEntries);
  };

  return (
    <InclusiveFormGroup
      name={'inclusiveExclusiveTax'}
      label={'Los importes son'}
      inline={true}
    >
      <FSelect
        name={'inclusiveExclusiveTax'}
        items={InclusiveButtonOptions}
        textAccessor={'label'}
        labelAccessor={() => ''}
        valueAccessor={'key'}
        popoverProps={{ minimal: true, usePortal: true, inline: false }}
        buttonProps={{ small: true }}
        onItemSelect={handleItemSelect}
        filterable={false}
        {...props}
      />
    </InclusiveFormGroup>
  );
}

const InclusiveFormGroup = styled(FFormGroup)`
  margin-left: auto;
`;
