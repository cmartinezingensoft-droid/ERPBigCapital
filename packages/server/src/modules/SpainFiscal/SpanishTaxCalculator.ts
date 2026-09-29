export type SpanishFiscalRegime = 'standard' | 'exempt' | 'not_subject' | 'reverse_charge';

export interface SpanishTaxCalculationInput {
  taxableBase: number;
  vatRate: number;
  fiscalRegime?: SpanishFiscalRegime;
  equivalenceSurchargeRate?: number;
  retentionRate?: number;
}

export interface SpanishTaxCalculationResult {
  taxableBase: number;
  vatAmount: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
  total: number;
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Shared Spanish line tax calculation used by documents and VERI*FACTU. */
export function calculateSpanishTax(input: SpanishTaxCalculationInput): SpanishTaxCalculationResult {
  const base = roundCurrency(input.taxableBase || 0);
  const regime = input.fiscalRegime || 'standard';
  const vatRate = regime === 'standard' ? Number(input.vatRate || 0) : 0;
  const surchargeRate = regime === 'standard' ? Number(input.equivalenceSurchargeRate || 0) : 0;
  const retentionRate = Number(input.retentionRate || 0);
  const vatAmount = roundCurrency(base * vatRate / 100);
  const equivalenceSurchargeAmount = roundCurrency(base * surchargeRate / 100);
  const retentionAmount = roundCurrency(base * retentionRate / 100);
  return {
    taxableBase: base,
    vatAmount,
    equivalenceSurchargeAmount,
    retentionAmount,
    total: roundCurrency(base + vatAmount + equivalenceSurchargeAmount - retentionAmount),
  };
}
