import React from 'react';
import styled from 'styled-components';
import { useInvoiceDetailDrawerContext } from './InvoiceDetailDrawerProvider';
import {
  T,
  TotalLines,
  TotalLine,
  TotalLineBorderStyle,
  TotalLineTextStyle,
} from '@/components';
import { formattedAmount } from '@/utils';

/**
 * Invoice details footer.
 */
export function InvoiceDetailTableFooter() {
  const { invoice } = useInvoiceDetailDrawerContext();

  if (!invoice) {
    return null;
  }

  return (
    <InvoiceDetailsFooterRoot>
      <InvoiceTotalLines labelColWidth={'180px'} amountColWidth={'180px'}>
        <TotalLine
          title={<T id={'invoice.details.subtotal'} />}
          value={invoice.subtotalFormatted}
          borderStyle={TotalLineBorderStyle.SingleDark}
        />
        {(invoice.taxes ?? []).map((taxRate) => (
          <TotalLine
            key={taxRate.id}
            title={`${taxRate.name} [${taxRate.taxRate}%]`}
            value={taxRate.taxRateAmountFormatted}
            textStyle={TotalLineTextStyle.Regular}
          />
        ))}
        {Number(invoice.equivalenceSurchargeAmount || 0) > 0 && (
          <TotalLine
            title="Recargo de equivalencia"
            value={formattedAmount(
              Number(invoice.equivalenceSurchargeAmount || 0),
              invoice.currencyCode,
            )}
            textStyle={TotalLineTextStyle.Regular}
          />
        )}
        {Number(invoice.retentionAmount || 0) > 0 && (
          <TotalLine
            title="Retención IRPF"
            value={`-${formattedAmount(
              Number(invoice.retentionAmount || 0),
              invoice.currencyCode,
            )}`}
            textStyle={TotalLineTextStyle.Regular}
          />
        )}
        {(invoice.discountAmount ?? 0) > 0 && (
          <TotalLine
            title={
              invoice.discountPercentageFormatted
                ? `Discount [${invoice.discountPercentageFormatted}]`
                : 'Discount'
            }
            value={invoice.discountAmountFormatted}
            textStyle={TotalLineTextStyle.Regular}
          />
        )}
        {invoice.adjustmentFormatted && (
          <TotalLine
            title="Ajuste"
            value={invoice.adjustmentFormatted}
            textStyle={TotalLineTextStyle.Regular}
          />
        )}
        <TotalLine
          title={<T id={'invoice.details.total'} />}
          value={invoice.totalFormatted}
          borderStyle={TotalLineBorderStyle.DoubleDark}
          textStyle={TotalLineTextStyle.Bold}
        />
        <TotalLine
          title={<T id={'invoice.details.payment_amount'} />}
          value={invoice.paymentAmountFormatted}
        />
        <TotalLine
          title={<T id={'invoice.details.due_amount'} />}
          value={invoice.dueAmountFormatted}
          textStyle={TotalLineTextStyle.Bold}
        />
      </InvoiceTotalLines>
    </InvoiceDetailsFooterRoot>
  );
}

const InvoiceDetailsFooterRoot = styled.div``;

const InvoiceTotalLines = styled(TotalLines)`
  margin-left: auto;
`;
