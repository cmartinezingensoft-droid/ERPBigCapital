/** Spanish NIF/CIF/NIE normalization and checksum validation. */
export function normalizeSpanishFiscalNumber(value: string): string {
  return (value || '').toUpperCase().replace(/[\s.-]/g, '');
}

const LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function isValidSpanishFiscalNumber(input: string): boolean {
  const value = normalizeSpanishFiscalNumber(input);
  if (/^\d{8}[A-Z]$/.test(value)) {
    return LETTERS[Number(value.slice(0, 8)) % 23] === value[8];
  }
  if (/^[XYZ]\d{7}[A-Z]$/.test(value)) {
    const numeric = Number(value.replace('X', '0').replace('Y', '1').replace('Z', '2').slice(0, 8));
    return LETTERS[numeric % 23] === value[8];
  }
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) {
    const digits = value.slice(1, 8).split('').map(Number);
    const sumEven = digits[1] + digits[3] + digits[5];
    const sumOdd = [digits[0], digits[2], digits[4], digits[6]].reduce((acc, n) => {
      const d = n * 2;
      return acc + Math.floor(d / 10) + (d % 10);
    }, 0);
    const control = (10 - ((sumEven + sumOdd) % 10)) % 10;
    const controlLetter = 'JABCDEFGHI'[control];
    const expected = value[8];
    if (/^[ABEH]$/.test(value[0])) return expected === String(control);
    if (/^[KPQS]$/.test(value[0])) return expected === controlLetter;
    return expected === String(control) || expected === controlLetter;
  }
  return false;
}


export interface FiscalIdentityFields {
  fiscalNumber?: string | null;
  fiscalCountry?: string | null;
  aeatIdType?: string | null;
  taxRegime?: string | null;
}

/** Normalizes fiscal identity and rejects invalid Spanish NIF/CIF/NIE values. */
export function normalizeFiscalIdentityFields<T extends FiscalIdentityFields>(input: T): T {
  const fiscalCountry = String(input.fiscalCountry || 'ES').trim().toUpperCase().slice(0, 2);
  const rawNumber = String(input.fiscalNumber || '').trim();
  const fiscalNumber = fiscalCountry === 'ES'
    ? normalizeSpanishFiscalNumber(rawNumber)
    : rawNumber;

  if (fiscalCountry === 'ES' && fiscalNumber && !isValidSpanishFiscalNumber(fiscalNumber)) {
    throw new Error('INVALID_SPANISH_FISCAL_NUMBER');
  }

  return {
    ...input,
    fiscalCountry,
    ...(rawNumber ? { fiscalNumber } : { fiscalNumber: rawNumber as any }),
    ...(input.aeatIdType != null
      ? { aeatIdType: String(input.aeatIdType).trim().toUpperCase().slice(0, 2) }
      : {}),
    ...(input.taxRegime != null
      ? { taxRegime: String(input.taxRegime).trim().toLowerCase() }
      : {}),
  };
}
