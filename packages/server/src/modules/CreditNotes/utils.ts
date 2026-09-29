// @ts-nocheck
import { CreditNotePdfTemplateAttributes, ICreditNote } from '@/interfaces';
import { contactAddressTextFormat } from '@/utils/address-text-format';
import { formatNumber } from '@/utils/format-number';

export const transformCreditNoteToPdfTemplate = (
  creditNote: ICreditNote,
): Partial<CreditNotePdfTemplateAttributes> => {
  const taxLines = [
    { label: 'IVA', value: Number((creditNote as any).taxAmountWithheld || 0) },
    {
      label: 'Recargo de equivalencia',
      value: Number((creditNote as any).equivalenceSurchargeAmount || 0),
    },
    {
      label: 'Retención IRPF',
      value: -Number((creditNote as any).retentionAmount || 0),
    },
  ]
    .filter((tax) => Math.abs(tax.value) > 0.000001)
    .map((tax) => ({
      label: tax.label,
      amount: formatNumber(tax.value, {
        currencyCode: creditNote.currencyCode,
        money: true,
      }),
    }));

  const originalInvoice = (creditNote as any).originalSaleInvoice;
  const originalInvoiceReference =
    originalInvoice?.invoiceNumber ||
    ((creditNote as any).originalSaleInvoiceId
      ? `#${(creditNote as any).originalSaleInvoiceId}`
      : undefined);

  return {
    documentTitle: 'Factura rectificativa',
    creditNoteDate: creditNote.formattedCreditNoteDate,
    creditNoteNumebr: creditNote.creditNoteNumber,

    total: (creditNote as any).totalFormatted || creditNote.formattedAmount,
    subtotal: creditNote.formattedSubtotal,
    taxes: taxLines,
    rectificationReference: originalInvoiceReference,
    rectificationReason: (creditNote as any).rectificationReason,

    lines: creditNote.entries?.map((entry) => ({
      item: entry.item.name,
      description: entry.description,
      rate: entry.rateFormatted,
      quantity: entry.quantityFormatted,
      total: entry.totalFormatted,
    })),
    customerNote: creditNote.note,
    termsConditions: creditNote.termsConditions,
    customerAddress: contactAddressTextFormat(creditNote.customer),
  };
};
