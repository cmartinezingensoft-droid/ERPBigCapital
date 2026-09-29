export type SpanishFiscalRegime =
  | 'standard'
  | 'exempt'
  | 'not_subject'
  | 'reverse_charge';

export type FiscalDiscountType = 'percentage' | 'amount';

export interface SpanishFiscalLineInput {
  quantity: number;
  rate: number;
  lineDiscountType?: FiscalDiscountType | string | null;
  lineDiscount?: number | null;
  vatRate?: number | null;
  isInclusiveTax?: boolean | number | null;
  fiscalRegime?: SpanishFiscalRegime | string | null;
  equivalenceSurchargeRate?: number | null;
  retentionRate?: number | null;
  documentDiscountAllocation?: number | null;
  documentAdjustmentAllocation?: number | null;
}

export interface SpanishFiscalLineResult {
  grossAmount: number;
  lineDiscountAmount: number;
  commercialAmount: number;
  documentDiscountAllocation: number;
  documentAdjustmentAllocation: number;
  discountTaxBaseAmount: number;
  discountTaxAmount: number;
  adjustmentTaxBaseAmount: number;
  taxableBase: number;
  vatAmount: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
  total: number;
}

export interface SpanishInvoiceFiscalInput {
  lines: SpanishFiscalLineInput[];
  documentDiscountType?: FiscalDiscountType | string | null;
  documentDiscount?: number | null;
  documentAdjustment?: number | null;
}

export interface SpanishInvoiceFiscalResult {
  lines: SpanishFiscalLineResult[];
  subtotal: number;
  documentDiscountAmount: number;
  documentAdjustmentAmount: number;
  taxableBase: number;
  vatAmount: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
  total: number;
}

const money = (value: number): number =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const precise = (value: number): number =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100000) / 100000;

const nonNegative = (value: number): number => Math.max(Number(value || 0), 0);

const normalizeRegime = (value?: string | null): SpanishFiscalRegime => {
  if (value === 'exempt' || value === 'not_subject' || value === 'reverse_charge') {
    return value;
  }
  return 'standard';
};

/**
 * Allocates a document-level monetary amount proportionally across line
 * commercial amounts. Currency cents are preserved exactly by assigning the
 * rounding remainder to the final positive line.
 */
export function allocateSpanishDocumentAmount(
  commercialAmounts: number[],
  requestedAmount: number,
): number[] {
  const amounts = commercialAmounts.map((value) => money(nonNegative(value)));
  const subtotal = money(amounts.reduce((sum, value) => sum + value, 0));
  if (!subtotal || !requestedAmount) return amounts.map(() => 0);

  const target = money(Math.abs(requestedAmount));
  const sign = requestedAmount < 0 ? -1 : 1;
  const positiveIndexes = amounts
    .map((value, index) => (value > 0 ? index : -1))
    .filter((index) => index >= 0);
  const lastIndex = positiveIndexes[positiveIndexes.length - 1];
  let assigned = 0;

  return amounts.map((value, index) => {
    if (!value) return 0;
    if (index === lastIndex) return money(sign * (target - assigned));
    const share = money(target * (value / subtotal));
    assigned = money(assigned + share);
    return money(sign * share);
  });
}

/**
 * Calculates one Spanish fiscal line after line discount and its allocated
 * share of document discount/adjustment. For VAT-inclusive prices, the VAT
 * portion of each document discount is separated from the taxable-base
 * portion so that multi-rate invoices remain arithmetically coherent.
 */
export function calculateSpanishFiscalLine(
  input: SpanishFiscalLineInput,
): SpanishFiscalLineResult {
  const quantity = Number(input.quantity || 0);
  const rate = Number(input.rate || 0);
  const grossAmount = money(quantity * rate);
  const lineDiscount = nonNegative(Number(input.lineDiscount || 0));
  const lineDiscountAmount = money(
    input.lineDiscountType === 'amount'
      ? Math.min(lineDiscount, grossAmount)
      : grossAmount * (Math.min(lineDiscount, 100) / 100),
  );
  const commercialAmount = money(Math.max(grossAmount - lineDiscountAmount, 0));

  const regime = normalizeRegime(input.fiscalRegime);
  const vatRate = regime === 'standard' ? nonNegative(Number(input.vatRate || 0)) : 0;
  const surchargeRate =
    regime === 'standard'
      ? nonNegative(Number(input.equivalenceSurchargeRate || 0))
      : 0;
  const retentionRate = nonNegative(Number(input.retentionRate || 0));
  const inclusive = Boolean(input.isInclusiveTax) && regime === 'standard' && vatRate > 0;

  const documentDiscountAllocation = money(
    Math.max(Number(input.documentDiscountAllocation || 0), 0),
  );
  const documentAdjustmentAllocation = money(
    Number(input.documentAdjustmentAllocation || 0),
  );

  const baseBeforeDocument = inclusive
    ? precise(commercialAmount / (1 + vatRate / 100))
    : precise(commercialAmount);
  const discountTaxBaseAmount = inclusive
    ? precise(documentDiscountAllocation / (1 + vatRate / 100))
    : precise(documentDiscountAllocation);
  const discountTaxAmount = money(
    inclusive
      ? documentDiscountAllocation - discountTaxBaseAmount
      : discountTaxBaseAmount * vatRate / 100,
  );
  const adjustmentTaxBaseAmount = inclusive
    ? precise(documentAdjustmentAllocation / (1 + vatRate / 100))
    : precise(documentAdjustmentAllocation);

  const taxableBase = money(
    Math.max(baseBeforeDocument - discountTaxBaseAmount + adjustmentTaxBaseAmount, 0),
  );
  const vatAmount = money(taxableBase * vatRate / 100);
  const equivalenceSurchargeAmount = money(taxableBase * surchargeRate / 100);
  const retentionAmount = money(taxableBase * retentionRate / 100);
  const total = money(
    taxableBase + vatAmount + equivalenceSurchargeAmount - retentionAmount,
  );

  return {
    grossAmount,
    lineDiscountAmount,
    commercialAmount,
    documentDiscountAllocation,
    documentAdjustmentAllocation,
    discountTaxBaseAmount: money(discountTaxBaseAmount),
    discountTaxAmount,
    adjustmentTaxBaseAmount: money(adjustmentTaxBaseAmount),
    taxableBase,
    vatAmount,
    equivalenceSurchargeAmount,
    retentionAmount,
    total,
  };
}

/**
 * Shared invoice-level fiscal engine used by backend, frontend and
 * VERI*FACTU. Global discounts and adjustments are distributed proportionally
 * to each line's commercial amount, preserving the tax base of every VAT rate.
 */
export function calculateSpanishInvoiceFiscal(
  input: SpanishInvoiceFiscalInput,
): SpanishInvoiceFiscalResult {
  const provisional = input.lines.map((line) => calculateSpanishFiscalLine(line));
  const commercialAmounts = provisional.map((line) => line.commercialAmount);
  const subtotal = money(commercialAmounts.reduce((sum, value) => sum + value, 0));

  const rawDiscount = nonNegative(Number(input.documentDiscount || 0));
  const documentDiscountAmount = money(
    input.documentDiscountType === 'amount'
      ? Math.min(rawDiscount, subtotal)
      : subtotal * (Math.min(rawDiscount, 100) / 100),
  );
  const documentAdjustmentAmount = money(
    Math.max(Number(input.documentAdjustment || 0), -subtotal),
  );

  const discountAllocations = allocateSpanishDocumentAmount(
    commercialAmounts,
    documentDiscountAmount,
  );
  const adjustmentAllocations = allocateSpanishDocumentAmount(
    commercialAmounts,
    documentAdjustmentAmount,
  );

  const lines = input.lines.map((line, index) =>
    calculateSpanishFiscalLine({
      ...line,
      documentDiscountAllocation: discountAllocations[index],
      documentAdjustmentAllocation: adjustmentAllocations[index],
    }),
  );

  return {
    lines,
    subtotal,
    documentDiscountAmount,
    documentAdjustmentAmount,
    taxableBase: money(lines.reduce((sum, line) => sum + line.taxableBase, 0)),
    vatAmount: money(lines.reduce((sum, line) => sum + line.vatAmount, 0)),
    equivalenceSurchargeAmount: money(
      lines.reduce((sum, line) => sum + line.equivalenceSurchargeAmount, 0),
    ),
    retentionAmount: money(lines.reduce((sum, line) => sum + line.retentionAmount, 0)),
    total: money(lines.reduce((sum, line) => sum + line.total, 0)),
  };
}
