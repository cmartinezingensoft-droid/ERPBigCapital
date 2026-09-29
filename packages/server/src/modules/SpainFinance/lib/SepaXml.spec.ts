import {
  buildPain001,
  buildPain008,
  isValidBic,
  isValidCreditorIdentifier,
  isValidIban,
  normalizeBic,
  normalizeIban,
  sha256,
} from './SepaXml';

describe('SEPA XML Phase 9', () => {
  const bank = {
    holder: 'Faro Industrial SL',
    iban: 'ES9121000418450200051332',
    bic: 'CAIXESBBXXX',
    countryCode: 'ES',
    creditorIdentifier: 'ES98ZZZ12345678',
  };

  it('validates and normalizes IBAN/BIC', () => {
    expect(normalizeIban('ES91 2100 0418 4502 0005 1332')).toBe(bank.iban);
    expect(isValidIban(bank.iban)).toBe(true);
    expect(isValidIban('ES0021000418450200051332')).toBe(false);
    expect(normalizeBic('caixesbbxxx')).toBe(bank.bic);
    expect(isValidBic(bank.bic)).toBe(true);
    expect(isValidBic('BAD')).toBe(false);
    expect(isValidCreditorIdentifier(bank.creditorIdentifier)).toBe(true);
    expect(isValidCreditorIdentifier('ES-INVALID')).toBe(false);
  });

  it('builds SCT pain.001.001.09 with totals and SEPA service level', () => {
    const xml = buildPain001({
      messageId: 'SCT-TEST-1',
      requestedDate: '2026-09-01',
      bank,
      createdAt: new Date('2026-08-29T09:00:00Z'),
      entries: [
        {
          counterpartyName: 'Proveedor Uno SL',
          iban: 'ES9121000418450200051332',
          bic: 'CAIXESBBXXX',
          countryCode: 'ES',
          amount: 125.5,
          endToEndId: 'PAY-1',
          remittanceInformation: 'Factura 2026/100',
        },
      ],
    });
    expect(xml).toContain('urn:iso:std:iso:20022:tech:xsd:pain.001.001.09');
    expect(xml).toContain('<SvcLvl><Cd>SEPA</Cd></SvcLvl>');
    expect(xml).toContain('<ChrgBr>SLEV</ChrgBr>');
    expect(xml).toContain('<CtrlSum>125.50</CtrlSum>');
    expect(xml).toContain('<EndToEndId>PAY-1</EndToEndId>');
    expect(sha256(xml)).toHaveLength(64);
  });

  it('builds SDD pain.008.001.08 with mandate and creditor identifier', () => {
    const xml = buildPain008({
      messageId: 'SDD-TEST-1',
      requestedDate: '2026-09-05',
      scheme: 'CORE',
      bank,
      createdAt: new Date('2026-08-29T09:00:00Z'),
      entries: [
        {
          counterpartyName: 'Cliente Uno SL',
          iban: 'ES9121000418450200051332',
          bic: 'CAIXESBBXXX',
          countryCode: 'ES',
          amount: 242,
          endToEndId: 'DD-1',
          mandateReference: 'MANDATO-1',
          signatureDate: '2026-08-01',
          sequenceType: 'FRST',
        },
      ],
    });
    expect(xml).toContain('urn:iso:std:iso:20022:tech:xsd:pain.008.001.08');
    expect(xml).toContain('<LclInstrm><Cd>CORE</Cd></LclInstrm>');
    expect(xml).toContain('<SeqTp>FRST</SeqTp>');
    expect(xml).toContain('<MndtId>MANDATO-1</MndtId>');
    expect(xml).toContain('<Id>ES98ZZZ12345678</Id>');
  });

  it('rejects direct debit without mandate data', () => {
    expect(() => buildPain008({
      messageId: 'SDD-TEST-2', requestedDate: '2026-09-05', scheme: 'CORE', bank,
      entries: [{ counterpartyName: 'Cliente', iban: bank.iban, amount: 1, endToEndId: 'DD-2' }],
    })).toThrow(/mandato SEPA/i);
  });
});
