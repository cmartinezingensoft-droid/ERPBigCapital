import { Position, Classes } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import moment from 'moment';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import {
  InvoiceExchangeRateInputField,
  InvoiceProjectSelectButton,
} from './components';
import { InvoiceFormInvoiceNumberField } from './InvoiceFormInvoiceNumberField';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { customerNameFieldShouldUpdate } from './utils';
import type { InvoiceFormValues } from './utils';
import {
  FFormGroup,
  FormattedMessage as T,
  CustomerDrawerLink,
  FieldRequiredHint,
  FeatureCan,
  CustomersSelect,
  Stack,
  FInputGroup,
  FSelect,
  Icon,
  FDateInput,
} from '@/components';
import { Features } from '@/constants';
import { PAYMENT_METHOD_OPTIONS } from '@/constants/spainFiscalOptions';
import { useCustomerUpdateExRate } from '@/containers/Entries/withExRateItemEntriesPriceRecalc';
import {
  ProjectsSelect,
  ProjectBillableEntriesLink,
} from '@/components/LegacyProjectsCompat';
import { useDateInputFormatter } from '@/hooks';

const getInvoiceFieldsStyle = (theme: Theme & { bpPrefix?: string }) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 450px;
    }
    .${theme.bpPrefix}-label {
      min-width: 150px;
      font-weight: 500;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Invoice form header fields.
 */
export function InvoiceFormHeaderFields() {
  const theme = useTheme();
  const { projects } = useInvoiceFormContext();
  const { values } = useFormikContext<InvoiceFormValues>();
  const invoiceFieldsClassName = getInvoiceFieldsStyle(theme);
  const dateInputFormatter = useDateInputFormatter();

  return (
    <Stack spacing={18} flex={1} className={invoiceFieldsClassName}>
      {/* ----------- Customer name ----------- */}
      <InvoiceFormCustomerSelect />

      {/* ----------- Exchange rate ----------- */}
      <InvoiceExchangeRateInputField />

      {/* ----------- Invoice date ----------- */}
      <FFormGroup
        name={'invoiceDate'}
        label={intl.get('invoice_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'invoiceDate'}
          {...dateInputFormatter}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Due date ----------- */}
      <FFormGroup
        name={'dueDate'}
        label={intl.get('due_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'dueDate'}
          {...dateInputFormatter}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
          fastField
        />
      </FFormGroup>

      <FFormGroup
        name={'paymentMethod'}
        label={'Forma de pago'}
        inline
        fastField
      >
        <FSelect
          name={'paymentMethod'}
          items={PAYMENT_METHOD_OPTIONS}
          valueAccessor={'key'}
          textAccessor={'label'}
          filterable={false}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      <FFormGroup
        name={'paymentTermsDays'}
        label={'Vencimientos'}
        helperText={'Días desde fecha factura. Ej: 30,60,90 genera tres efectos.'}
        inline
      >
        <FInputGroup name={'paymentTermsDays'} placeholder={'30,60,90'} />
      </FFormGroup>

      <FFormGroup name={'operationDate'} label={'Fecha de operación'} inline fastField>
        <FDateInput
          name={'operationDate'}
          {...dateInputFormatter}
          popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true, fill: true }}
          inputProps={{ leftIcon: <Icon icon={'date-range'} />, fill: true }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Invoice number ----------- */}
      <InvoiceFormInvoiceNumberField />

      {/* ----------- Reference ----------- */}
      <FFormGroup name={'referenceNo'} label={intl.get('reference')} inline>
        <FInputGroup
          name={'referenceNo'}
          data-testId="invoice-reference-input"
        />
      </FFormGroup>

      <FFormGroup name={'purchaseOrderReference'} label={'Pedido del cliente'} inline>
        <FInputGroup name={'purchaseOrderReference'} placeholder={'Referencia de pedido'} />
      </FFormGroup>
      <FFormGroup name={'receiverContractReference'} label={'Contrato receptor'} inline>
        <FInputGroup name={'receiverContractReference'} placeholder={'Referencia de contrato'} />
      </FFormGroup>
      <FFormGroup name={'receiverTransactionReference'} label={'Referencia transacción'} inline>
        <FInputGroup name={'receiverTransactionReference'} placeholder={'Referencia de operación/pedido'} />
      </FFormGroup>

      {/*------------ Project name -----------*/}
      <FeatureCan feature={Features.Projects}>
        <FFormGroup
          name={'projectId'}
          label={intl.get('invoice.project_name.label')}
          inline={true}
          className={classNames('form-group--select-list', Classes.FILL)}
        >
          <>
            <ProjectsSelect
              name={'projectId'}
              projects={projects}
              input={InvoiceProjectSelectButton}
              popoverFill={true}
            />
            {values?.projectId && (
              <ProjectBillableEntriesLink projectId={values?.projectId}>
                <T id={'add_billable_entries'} />
              </ProjectBillableEntriesLink>
            )}
          </>
        </FFormGroup>
      </FeatureCan>
    </Stack>
  );
}

/**
 * Customer select field of the invoice form.
 * @returns {React.ReactNode}
 */
function InvoiceFormCustomerSelect() {
  const { values, setFieldValue } = useFormikContext<InvoiceFormValues>();
  const { customers } = useInvoiceFormContext();

  const updateEntries = useCustomerUpdateExRate();

  // Handles the customer item change.
  const handleItemChange = (customer: {
    id: number;
    currencyCode: string;
    paymentMethod?: string;
    paymentTermsDays?: string;
  }) => {
    // If the customer id has changed change the customer id and currency code.
    if (values.customerId !== customer.id) {
      setFieldValue('customerId', customer.id);
      setFieldValue('currencyCode', customer.currencyCode);
    }
    if (customer.paymentMethod) {
      setFieldValue('paymentMethod', customer.paymentMethod);
    }
    if (customer.paymentTermsDays) {
      setFieldValue('paymentTermsDays', customer.paymentTermsDays);

      const dueDays = customer.paymentTermsDays
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((day) => Number.isFinite(day) && day >= 0);

      if (dueDays.length) {
        setFieldValue(
          'dueDate',
          moment(values.invoiceDate).add(Math.max(...dueDays), 'days').format('YYYY-MM-DD'),
        );
      }
    }
    updateEntries(customer);
  };

  return (
    <FFormGroup
      name={'customerId'}
      label={intl.get('customer_name')}
      inline={true}
      labelInfo={<FieldRequiredHint />}
      fastField={true}
    >
      <>
        <CustomersSelect
          name={'customerId'}
          items={customers}
          placeholder={<T id={'select_customer_account'} />}
          onItemChange={handleItemChange}
          allowCreate={true}
          fastField={true}
          shouldUpdate={customerNameFieldShouldUpdate}
          shouldUpdateDeps={{ items: customers }}
          buttonProps={{ 'data-testId': 'invoice-customer-select' }}
        />
        {values.customerId && (
          <CustomerButtonLink customerId={values.customerId}>
            <T id={'view_customer_details'} />
          </CustomerButtonLink>
        )}
      </>
    </FFormGroup>
  );
}

const CustomerButtonLink = styled(CustomerDrawerLink)`
  font-size: 11px;
  margin-top: 6px;
`;
