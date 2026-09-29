import { renderSiiInvoiceEnvelope, renderSiiPaymentEnvelope } from './SiiXml';

const issuer = { name: 'EMPRESA DEMO SL', taxNumber: 'B12345678', countryCode: 'ES' };
const customer = { name: 'CLIENTE DEMO SA', taxNumber: 'A12345678', countryCode: 'ES' };
const vendor = { name: 'PROVEEDOR DEMO SL', taxNumber: 'B87654321', countryCode: 'ES' };

const baseInvoice = {
  issuer,
  invoiceNumber: 'F-2026-001',
  invoiceDate: '2026-08-29',
  operationDate: '2026-08-29',
  accountingDate: '2026-08-29',
  invoiceType: 'F1',
  description: 'Prueba SII',
  periodYear: '2026',
  periodMonth: '08',
  regimeKey: '01',
  total: 121,
  deductibleVat: 21,
  lines: [{ rate: 21, base: 100, vat: 21, operationType: 'domestic' }],
};

describe('SII XML 1.1', () => {
  it('uses the stable AEAT namespaces and issued invoice structure', () => {
    const xml = renderSiiInvoiceEnvelope({ ...baseInvoice, direction: 'issued', counterparty: customer });
    expect(xml).toContain('/aeat/ssii/fact/ws/SuministroLR.xsd');
    expect(xml).not.toContain('/ssii_1_1/');
    expect(xml).toContain('<siiLR:RegistroLRFacturasEmitidas>');
    expect(xml).toContain('<sii:CuotaRepercutida>21.00</sii:CuotaRepercutida>');
  });

  it('renders the mandatory received-invoice accounting fields', () => {
    const xml = renderSiiInvoiceEnvelope({ ...baseInvoice, direction: 'received', counterparty: vendor });
    expect(xml).toContain('<siiLR:RegistroLRFacturasRecibidas>');
    expect(xml).toContain('<sii:CuotaSoportada>21.00</sii:CuotaSoportada>');
    expect(xml).toContain('<sii:FechaRegContable>29-08-2026</sii:FechaRegContable>');
    expect(xml).toContain('<sii:CuotaDeducible>21.00</sii:CuotaDeducible>');
  });

  it('renders RECC collection without liquidation period or communication type', () => {
    const xml = renderSiiPaymentEnvelope({
      direction: 'issued', issuer, invoiceIssuerTaxNumber: issuer.taxNumber,
      invoiceNumber: 'F-2026-001', invoiceDate: '2026-08-29', paymentDate: '2026-08-29',
      amount: 121, methodCode: '01', periodYear: '2026', periodMonth: '08',
    });
    expect(xml).toContain('<siiLR:RegistroLRCobros>');
    expect(xml).toContain('<sii:Cobro>');
    expect(xml).not.toContain('PeriodoLiquidacion');
    expect(xml).not.toContain('TipoComunicacion');
  });

  it('includes supplier identity in RECC payments for received invoices', () => {
    const xml = renderSiiPaymentEnvelope({
      direction: 'received', issuer, invoiceIssuerTaxNumber: vendor.taxNumber,
      invoiceIssuerName: vendor.name, invoiceIssuerCountryCode: 'ES', invoiceNumber: 'P-2026-001',
      invoiceDate: '2026-08-29', paymentDate: '2026-08-29', amount: 121, methodCode: '01',
      periodYear: '2026', periodMonth: '08',
    });
    expect(xml).toContain('<siiLR:RegistroLRPagos>');
    expect(xml).toContain('<sii:Pago>');
    expect(xml).toContain(`<sii:NombreRazon>${vendor.name}</sii:NombreRazon>`);
  });
});
