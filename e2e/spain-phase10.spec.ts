import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import {
  createBillPaymentViaApi,
  createCustomerViaApi,
  createDeliveredInvoiceViaApi,
  createItemViaApi,
  createOpenedBillViaApi,
  createPaymentReceivedViaApi,
  createTaxRateViaApi,
  createVendorViaApi,
  findCustomerIdByName,
  findItemIdByName,
  findVendorIdByName,
  getJsonViaApi,
  readApiAuth,
} from './_api';

const API_BASE = process.env.PLAYWRIGHT_TEST_API_URL || 'http://localhost:3000';
const today = () => new Date().toISOString().slice(0, 10);

function idOf(value: any): number {
  const id = Number(value?.id ?? value?.data?.id);
  if (!id) throw new Error(`Expected an id in API response: ${JSON.stringify(value)}`);
  return id;
}

test.describe('España · cierre fase 10', () => {
  test('las consolas españolas principales son navegables', async ({ page }) => {
    const pages: Array<[string, RegExp]> = [
      ['/spain-fiscal', /Fiscalidad España/i],
      ['/spain-finance', /Finanzas España/i],
      ['/verifactu', /VERI\*FACTU/i],
      ['/electronic-invoicing', /Factura electrónica/i],
      ['/sii', /SII/i],
    ];

    for (const [path, heading] of pages) {
      await page.goto(path);
      await expect(page.locator('body')).toContainText(heading, { timeout: 30_000 });
    }
  });

  test('venta + cobro + compra + pago alimentan libros IVA y contabilidad', async () => {
    const auth = readApiAuth();
    const suffix = faker.string.alphanumeric(7).toUpperCase();
    const date = today();
    const customerName = `E2E ES Cliente ${suffix}`;
    const vendorName = `E2E ES Proveedor ${suffix}`;
    const itemName = `E2E ES Servicio ${suffix}`;

    await createCustomerViaApi(API_BASE, auth, {
      displayName: customerName,
      currencyCode: 'EUR',
      fiscalNumber: 'B12345674',
      fiscalCountry: 'ES',
      fiscalTerritory: 'common',
      taxRegime: 'standard',
    });
    await createVendorViaApi(API_BASE, auth, {
      displayName: vendorName,
      currencyCode: 'EUR',
      fiscalNumber: 'B87654323',
      fiscalCountry: 'ES',
      fiscalTerritory: 'common',
      taxRegime: 'standard',
    });
    await createItemViaApi(API_BASE, auth, {
      name: itemName,
      type: 'service',
      sellPrice: 100,
      costPrice: 50,
    });
    const tax = await createTaxRateViaApi(API_BASE, auth, {
      name: `IVA 21 E2E ${suffix}`,
      code: `E2EIVA21${suffix}`,
      rate: 21,
      taxTerritory: 'iva',
      fiscalRegime: 'standard',
      spanishOperationType: 'domestic',
      aeatTaxCode: '01',
      aeatRegimeKey: '01',
      aeatOperationQualification: 'S1',
    });

    const [customerId, vendorId, itemId] = await Promise.all([
      findCustomerIdByName(API_BASE, auth, customerName),
      findVendorIdByName(API_BASE, auth, vendorName),
      findItemIdByName(API_BASE, auth, itemName),
    ]);
    const taxRateId = idOf(tax);

    const invoice = await createDeliveredInvoiceViaApi(API_BASE, auth, {
      customerId,
      itemId,
      rate: 100,
      quantity: 1,
      date,
      taxRateId,
    });
    const bill = await createOpenedBillViaApi(API_BASE, auth, {
      vendorId,
      itemId,
      rate: 50,
      quantity: 1,
      date,
      taxRateId,
    });

    await createPaymentReceivedViaApi(API_BASE, auth, {
      customerId,
      invoiceId: idOf(invoice),
      amount: 121,
      date,
    });
    await createBillPaymentViaApi(API_BASE, auth, {
      vendorId,
      billId: idOf(bill),
      amount: 60.5,
      date,
    });

    const query = `?fromDate=${date}&toDate=${date}`;
    const books = await getJsonViaApi(API_BASE, auth, `/spain/fiscal/vat-books${query}`);
    const invoiceRow = books.issued?.find((row: any) => row.documentId === idOf(invoice));
    const billRow = books.received?.find((row: any) => row.documentId === idOf(bill));

    expect(invoiceRow).toBeTruthy();
    expect(invoiceRow.taxableBase).toBe(100);
    expect(invoiceRow.vatAmount).toBe(21);
    expect(invoiceRow.taxTerritory).toBe('iva');
    expect(billRow).toBeTruthy();
    expect(billRow.taxableBase).toBe(50);
    expect(billRow.vatAmount).toBe(10.5);

    const model303 = await getJsonViaApi(API_BASE, auth, `/spain/fiscal/model-303-preview${query}`);
    expect(model303.status).toBe('PREVIEW');
    expect(model303.accrued.outputVat).toBeGreaterThanOrEqual(21);
    expect(model303.deductible?.inputVat ?? model303.deductibleInputVat ?? 0).toBeGreaterThanOrEqual(10.5);

    const trial = await getJsonViaApi(API_BASE, auth, `/spain/finance/pgc/trial-balance${query}`);
    expect(Array.isArray(trial.rows)).toBeTruthy();
    expect(trial.rows.length).toBeGreaterThan(0);
    expect(trial.balanced).toBe(true);
  });
});
