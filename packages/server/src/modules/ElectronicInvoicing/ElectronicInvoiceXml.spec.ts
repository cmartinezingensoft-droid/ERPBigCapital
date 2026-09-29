import { ElectronicInvoiceCanonical } from './ElectronicInvoice.types';
import { renderFacturae322 } from './lib/Facturae322';
import { renderUbl21 } from './lib/Ubl21';

const invoice: ElectronicInvoiceCanonical = {
  semanticModel: 'EN16931',
  profileVersion: '2026.1',
  sourceInvoiceId: 1,
  invoiceNo: 'F-2026-0001',
  issueDate: '2026-08-29',
  operationDate: '2026-08-28',
  dueDate: '2026-09-28',
  currencyCode: 'EUR',
  invoiceType: '380',
  seller: {
    personType: 'J',
    name: 'EMPRESA PRUEBA SL',
    taxNumber: 'B12345678',
    countryCode: 'ES',
    address: { address1: 'Calle Mayor 1', city: 'Madrid', postalCode: '28001', state: 'Madrid', countryCode: 'ES' },
  },
  buyer: {
    personType: 'J',
    name: 'CLIENTE PRUEBA SA',
    taxNumber: 'A87654321',
    countryCode: 'ES',
    address: { address1: 'Avenida Europa 2', city: 'Valencia', postalCode: '46001', state: 'Valencia', countryCode: 'ES' },
  },
  dir3: {
    accountingOffice: 'L01234567',
    managementBody: 'L07654321',
    processingUnit: 'L01111111',
  },
  references: {
    purchaseOrder: 'PED-123',
    contract: 'CON-456',
    receiverTransaction: 'TRX-789',
    generalReference: 'REF-001',
  },
  lines: [
    {
      id: '1', description: 'Servicio', quantity: 1, unitCode: 'C62', unitPrice: 100,
      grossAmount: 100, allowanceAmount: 0, chargeAmount: 0, netAmount: 100,
      vatRate: 21, vatCategory: 'S', vatAmount: 21, equivalenceSurchargeAmount: 5.2,
      retentionAmount: 15, fiscalRegime: 'standard',
    },
    {
      id: '2', description: 'Servicio exento', quantity: 1, unitCode: 'C62', unitPrice: 50,
      grossAmount: 50, allowanceAmount: 0, chargeAmount: 0, netAmount: 50,
      vatRate: 0, vatCategory: 'E', vatAmount: 0, equivalenceSurchargeAmount: 0,
      retentionAmount: 0, fiscalRegime: 'exempt',
    },
  ],
  taxes: [
    { vatRate: 21, vatCategory: 'S', fiscalRegime: 'standard', taxableBase: 100, vatAmount: 21, equivalenceSurchargeAmount: 5.2, retentionAmount: 15 },
    { vatRate: 0, vatCategory: 'E', fiscalRegime: 'exempt', taxableBase: 50, vatAmount: 0, equivalenceSurchargeAmount: 0, retentionAmount: 0 },
  ],
  totals: {
    lineExtensionAmount: 150,
    allowanceTotalAmount: 0,
    chargeTotalAmount: 0,
    taxExclusiveAmount: 150,
    vatAmount: 21,
    equivalenceSurchargeAmount: 5.2,
    retentionAmount: 15,
    taxInclusiveAmount: 176.2,
    payableAmount: 161.2,
  },
};

describe('Spanish electronic invoice renderers', () => {
  it('renders Facturae 3.2.2 with DIR3 and Spanish fiscal extensions', () => {
    const xml = renderFacturae322(invoice);
    expect(xml).toContain('<SchemaVersion>3.2.2</SchemaVersion>');
    expect(xml).toContain('<RoleTypeCode>01</RoleTypeCode>');
    expect(xml).toContain('<RoleTypeCode>02</RoleTypeCode>');
    expect(xml).toContain('<RoleTypeCode>03</RoleTypeCode>');
    expect(xml).toContain('<EquivalenceSurcharge>5.20</EquivalenceSurcharge>');
    expect(xml).toContain('<ReceiverTransactionReference>TRX-789</ReceiverTransactionReference>');
    expect(xml).toContain('<ReceiverContractReference>CON-456</ReceiverContractReference>');
  });

  it('renders UBL 2.1 EN16931 baseline with RE and exemption semantics', () => {
    const xml = renderUbl21(invoice, 'ENDPOINT-001');
    expect(xml).toContain('<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>');
    expect(xml).toContain('<cbc:ID>RE</cbc:ID>');
    expect(xml).toContain('<cbc:TaxExemptionReason>Operación exenta de IVA conforme a la normativa aplicable</cbc:TaxExemptionReason>');
    expect(xml).toContain('TRX-789');
    expect(xml).toContain('REF-001');
  });
});
