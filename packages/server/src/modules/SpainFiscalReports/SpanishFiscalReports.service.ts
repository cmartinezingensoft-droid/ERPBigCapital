import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { Bill } from '@/modules/Bills/models/Bill';
import { CreditNote } from '@/modules/CreditNotes/models/CreditNote';
import { VendorCredit } from '@/modules/VendorCredit/models/VendorCredit';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { Expense } from '@/modules/Expenses/models/Expense.model';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { SpanishFiscalReportsQueryDto } from './dtos/SpanishFiscalReportsQuery.dto';
import { SpanishFiscalSettingsService } from './SpanishFiscalSettings.service';

export type SpanishOperationType =
  | 'domestic'
  | 'intra_community_goods_supply'
  | 'intra_community_goods_acquisition'
  | 'intra_community_service_supply'
  | 'intra_community_service_acquisition'
  | 'export'
  | 'import'
  | 'domestic_reverse_charge'
  | 'oss'
  | 'ioss'
  | 'igic_ipsi'
  | 'other';

export interface SpanishVatBookRow {
  documentType: 'SaleInvoice' | 'CreditNote' | 'Bill' | 'VendorCredit' | 'Expense';
  documentId: number;
  documentNumber: string;
  date: string;
  counterpartyName?: string;
  counterpartyFiscalNumber?: string;
  counterpartyCountry?: string;
  viesStatus?: string;
  fiscalRegime: string;
  operationType: SpanishOperationType;
  taxTerritory: string;
  aeatRegimeKey?: string;
  aeatOperationQualification?: string;
  aeatExemptionCause?: string;
  ossScheme?: string;
  vatRate: number;
  taxableBase: number;
  vatAmount: number;
  equivalenceSurchargeRate: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
  sign: 1 | -1;
  originalSaleInvoiceId?: number;
  rectificationReason?: string;
}

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const quarter = (date: string) => {
  const month = Number(String(date).slice(5, 7));
  return `T${Math.min(4, Math.max(1, Math.ceil(month / 3)))}`;
};

const selfAssessedTypes = new Set<SpanishOperationType>([
  'intra_community_goods_acquisition',
  'intra_community_service_acquisition',
  'domestic_reverse_charge',
]);

const model349Code = (type: SpanishOperationType) => ({
  intra_community_goods_supply: 'E',
  intra_community_goods_acquisition: 'A',
  intra_community_service_supply: 'S',
  intra_community_service_acquisition: 'I',
}[type] || '');

@Injectable()
export class SpanishFiscalReportsService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
    @Inject(Bill.name)
    private readonly billModel: TenantModelProxy<typeof Bill>,
    @Inject(CreditNote.name)
    private readonly creditNoteModel: TenantModelProxy<typeof CreditNote>,
    @Inject(VendorCredit.name)
    private readonly vendorCreditModel: TenantModelProxy<typeof VendorCredit>,
    @Inject(Expense.name)
    private readonly expenseModel: TenantModelProxy<typeof Expense>,
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
    private readonly settings: SpanishFiscalSettingsService,
  ) {}

  private applyPeriod(query: any, dateColumn: string, filter: SpanishFiscalReportsQueryDto) {
    if (filter.fromDate) query.where(dateColumn, '>=', filter.fromDate);
    if (filter.toDate) query.where(dateColumn, '<=', filter.toDate);
    return query;
  }

  private fiscal(entry: ItemEntry, document: any) {
    return calculateSpanishFiscalLine({
      quantity: Number(entry.quantity || 0),
      rate: Number(entry.rate || 0),
      lineDiscountType: entry.discountType,
      lineDiscount: Number(entry.discount || 0),
      vatRate: Number(entry.taxRate || 0),
      isInclusiveTax: Boolean(entry.isInclusiveTax ?? document.isInclusiveTax),
      fiscalRegime: entry.fiscalRegime || 'standard',
      equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
      retentionRate: Number(entry.retentionRate || 0),
      documentDiscountAllocation: Number(entry.documentDiscountAllocation || 0),
      documentAdjustmentAllocation: Number(entry.documentAdjustmentAllocation || 0),
    });
  }

  private rowsFromDocument(
    document: any,
    type: SpanishVatBookRow['documentType'],
    sign: 1 | -1,
    counterparty: any,
    number: string,
    date: any,
  ): SpanishVatBookRow[] {
    return (document.entries || []).map((entry: ItemEntry) => {
      const f = this.fiscal(entry, document);
      return {
        documentType: type,
        documentId: Number(document.id),
        documentNumber: String(number || ''),
        date: String(date || '').slice(0, 10),
        counterpartyName: counterparty?.displayName,
        counterpartyFiscalNumber: counterparty?.fiscalNumber,
        counterpartyCountry: String(counterparty?.fiscalCountry || 'ES').toUpperCase(),
        viesStatus: counterparty?.viesStatus || 'unknown',
        fiscalRegime: String(entry.fiscalRegime || 'standard'),
        operationType: String(entry.spanishOperationType || 'domestic') as SpanishOperationType,
        taxTerritory: String(entry.taxTerritory || 'iva'),
        aeatRegimeKey: entry.aeatRegimeKey,
        aeatOperationQualification: entry.aeatOperationQualification,
        aeatExemptionCause: entry.aeatExemptionCause,
        ossScheme: entry.ossScheme,
        vatRate: Number(entry.taxRate || 0),
        taxableBase: round2(sign * f.taxableBase),
        vatAmount: round2(sign * f.vatAmount),
        equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
        equivalenceSurchargeAmount: round2(sign * f.equivalenceSurchargeAmount),
        retentionAmount: round2(sign * f.retentionAmount),
        sign,
        ...(type === 'CreditNote' && document.originalSaleInvoiceId
          ? { originalSaleInvoiceId: Number(document.originalSaleInvoiceId) }
          : {}),
        ...(type === 'CreditNote' && document.rectificationReason
          ? { rectificationReason: String(document.rectificationReason) }
          : {}),
      };
    });
  }

  private rowsFromExpense(expense: any): SpanishVatBookRow[] {
    return (expense.categories || []).map((category: any) => ({
      documentType: 'Expense' as const,
      documentId: Number(expense.id),
      documentNumber: String(expense.referenceNo || ''),
      date: String(expense.paymentDate || '').slice(0, 10),
      counterpartyName: expense.payee || undefined,
      fiscalRegime: String(category.fiscalRegime || 'standard'),
      operationType: 'domestic' as const,
      taxTerritory: String(category.taxTerritory || 'iva'),
      vatRate: Number(category.taxRate || 0),
      taxableBase: round2(Number(category.amount || 0)),
      vatAmount: round2(Number(category.taxAmount || 0)),
      equivalenceSurchargeRate: Number(category.equivalenceSurchargeRate || 0),
      equivalenceSurchargeAmount: round2(Number(category.equivalenceSurchargeAmount || 0)),
      retentionAmount: round2(Number(category.retentionAmount || 0)),
      sign: 1 as const,
    }));
  }

  public async vatBooks(filter: SpanishFiscalReportsQueryDto) {
    const invoicesQuery = this.saleInvoiceModel()
      .query()
      .whereNotNull('delivered_at')
      .withGraphFetched('[entries, customer]');
    this.applyPeriod(invoicesQuery, 'invoice_date', filter);

    const creditNotesQuery = this.creditNoteModel()
      .query()
      .whereNotNull('opened_at')
      .withGraphFetched('[entries, customer]');
    this.applyPeriod(creditNotesQuery, 'credit_note_date', filter);

    const billsQuery = this.billModel()
      .query()
      .whereNotNull('opened_at')
      .withGraphFetched('[entries, vendor]');
    this.applyPeriod(billsQuery, 'bill_date', filter);

    const vendorCreditsQuery = this.vendorCreditModel()
      .query()
      .whereNotNull('opened_at')
      .withGraphFetched('[entries, vendor]');
    this.applyPeriod(vendorCreditsQuery, 'vendor_credit_date', filter);

    const expensesQuery = this.expenseModel()
      .query()
      .whereNotNull('published_at')
      .withGraphFetched('categories');
    this.applyPeriod(expensesQuery, 'payment_date', filter);

    const [invoices, creditNotes, bills, vendorCredits, expenses] = await Promise.all([
      invoicesQuery,
      creditNotesQuery,
      billsQuery,
      vendorCreditsQuery,
      expensesQuery,
    ]);

    const issued = [
      ...invoices.flatMap((doc: any) =>
        this.rowsFromDocument(doc, 'SaleInvoice', 1, doc.customer, doc.invoiceNo, doc.invoiceDate),
      ),
      ...creditNotes.flatMap((doc: any) =>
        this.rowsFromDocument(doc, 'CreditNote', -1, doc.customer, doc.creditNoteNumber, doc.creditNoteDate),
      ),
    ];
    const received = [
      ...bills.flatMap((doc: any) =>
        this.rowsFromDocument(doc, 'Bill', 1, doc.vendor, doc.billNumber, doc.billDate),
      ),
      ...vendorCredits.flatMap((doc: any) =>
        this.rowsFromDocument(doc, 'VendorCredit', -1, doc.vendor, doc.vendorCreditNumber, doc.vendorCreditDate),
      ),
      ...expenses.flatMap((doc: any) => this.rowsFromExpense(doc)),
    ];

    return {
      period: filter,
      issued,
      received,
      totals: {
        issuedBase: round2(issued.reduce((s, r) => s + r.taxableBase, 0)),
        outputVat: round2(issued.reduce((s, r) => s + r.vatAmount, 0)),
        outputEquivalenceSurcharge: round2(issued.reduce((s, r) => s + r.equivalenceSurchargeAmount, 0)),
        receivedBase: round2(received.reduce((s, r) => s + r.taxableBase, 0)),
        inputVat: round2(received.reduce((s, r) => s + r.vatAmount, 0)),
        purchaseEquivalenceSurcharge: round2(received.reduce((s, r) => s + r.equivalenceSurchargeAmount, 0)),
        salesWithholdings: round2(issued.reduce((s, r) => s + r.retentionAmount, 0)),
        purchaseWithholdings: round2(received.reduce((s, r) => s + r.retentionAmount, 0)),
        ivaOutputTax: round2(issued.filter((r) => r.taxTerritory === 'iva').reduce((s, r) => s + r.vatAmount, 0)),
        ivaInputTax: round2(received.filter((r) => r.taxTerritory === 'iva').reduce((s, r) => s + r.vatAmount, 0)),
        igicOutputTax: round2(issued.filter((r) => r.taxTerritory === 'igic').reduce((s, r) => s + r.vatAmount, 0)),
        igicInputTax: round2(received.filter((r) => r.taxTerritory === 'igic').reduce((s, r) => s + r.vatAmount, 0)),
        ipsiOutputTax: round2(issued.filter((r) => r.taxTerritory === 'ipsi').reduce((s, r) => s + r.vatAmount, 0)),
        ipsiInputTax: round2(received.filter((r) => r.taxTerritory === 'ipsi').reduce((s, r) => s + r.vatAmount, 0)),
      },
    };
  }

  private byRate(rows: SpanishVatBookRow[]) {
    const groups = new Map<string, { rate: number; base: number; vat: number; surcharge: number }>();
    rows.forEach((row) => {
      const key = String(row.vatRate);
      const current = groups.get(key) || { rate: row.vatRate, base: 0, vat: 0, surcharge: 0 };
      current.base = round2(current.base + row.taxableBase);
      current.vat = round2(current.vat + row.vatAmount);
      current.surcharge = round2(current.surcharge + row.equivalenceSurchargeAmount);
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => a.rate - b.rate);
  }

  private async reccPaymentRatios(filter: SpanishFiscalReportsQueryDto) {
    const knex = this.tenantKnex();
    const received = knex('payment_receives_entries as e')
      .join('payment_receives as p', 'p.id', 'e.payment_receive_id')
      .select('e.invoice_id')
      .sum({ paid: 'e.payment_amount' })
      .groupBy('e.invoice_id');
    const paid = knex('bills_payments_entries as e')
      .join('bills_payments as p', 'p.id', 'e.bill_payment_id')
      .select('e.bill_id')
      .sum({ paid: 'e.payment_amount' })
      .groupBy('e.bill_id');
    if (filter.fromDate) {
      received.where('p.payment_date', '>=', filter.fromDate);
      paid.where('p.payment_date', '>=', filter.fromDate);
    }
    if (filter.toDate) {
      received.where('p.payment_date', '<=', filter.toDate);
      paid.where('p.payment_date', '<=', filter.toDate);
    }
    const [receivedRows, paidRows] = await Promise.all([received, paid]);
    return {
      invoices: new Map(receivedRows.map((r: any) => [Number(r.invoiceId ?? r.invoice_id), Number(r.paid || 0)])),
      bills: new Map(paidRows.map((r: any) => [Number(r.billId ?? r.bill_id), Number(r.paid || 0)])),
    };
  }

  private applyReccRatios(
    rows: SpanishVatBookRow[],
    payments: Map<number, number>,
    eligibleDocumentType: 'SaleInvoice' | 'Bill',
  ) {
    const totals = new Map<number, number>();
    rows.forEach((row) => {
      if (row.operationType !== 'domestic' || row.documentType !== eligibleDocumentType) return;
      const gross = row.taxableBase + row.vatAmount + row.equivalenceSurchargeAmount - row.retentionAmount;
      totals.set(row.documentId, round2((totals.get(row.documentId) || 0) + gross));
    });
    return rows.map((row) => {
      if (row.operationType !== 'domestic' || row.documentType !== eligibleDocumentType) return row;
      const total = Math.abs(totals.get(row.documentId) || 0);
      const paid = Math.abs(payments.get(row.documentId) || 0);
      const ratio = total > 0 ? Math.min(1, paid / total) : 0;
      return {
        ...row,
        taxableBase: round2(row.taxableBase * ratio),
        vatAmount: round2(row.vatAmount * ratio),
        equivalenceSurchargeAmount: round2(row.equivalenceSurchargeAmount * ratio),
        retentionAmount: round2(row.retentionAmount * ratio),
      };
    });
  }

  public async model303Preview(filter: SpanishFiscalReportsQueryDto) {
    const [books, config] = await Promise.all([this.vatBooks(filter), this.settings.getConfig()]);
    let issued = books.issued.filter((row) => row.taxTerritory === 'iva');
    let received = books.received.filter((row) => row.taxTerritory === 'iva');
    if (config.reccEnabled) {
      const payments = await this.reccPaymentRatios(filter);
      issued = this.applyReccRatios(issued, payments.invoices, 'SaleInvoice');
      const billRows = this.applyReccRatios(received.filter((r) => r.documentType !== 'Expense'), payments.bills, 'Bill');
      received = [...billRows, ...received.filter((r) => r.documentType === 'Expense')];
    }

    const domesticIssued = issued.filter((row) => row.operationType === 'domestic' && row.fiscalRegime === 'standard');
    const domesticReceived = received.filter((row) => row.operationType === 'domestic' && row.fiscalRegime === 'standard');
    const intraSupply = issued.filter((r) => ['intra_community_goods_supply', 'intra_community_service_supply'].includes(r.operationType));
    const exports = issued.filter((r) => r.operationType === 'export');
    const acquisitions = received.filter((r) => selfAssessedTypes.has(r.operationType));
    const imports = received.filter((r) => r.operationType === 'import');
    const exemptIssued = issued.filter((row) => row.fiscalRegime === 'exempt');
    const notSubjectIssued = issued.filter((row) => row.fiscalRegime === 'not_subject');

    const selfAssessedVat = round2(acquisitions.reduce((s, row) => s + row.taxableBase * row.vatRate / 100, 0));
    const importVat = round2(imports.reduce((s, row) => s + row.taxableBase * row.vatRate / 100, 0));
    const outputVat = round2(domesticIssued.reduce((s, row) => s + row.vatAmount, 0));
    const outputSurcharge = round2(domesticIssued.reduce((s, row) => s + row.equivalenceSurchargeAmount, 0));
    const rawInputVat = round2(domesticReceived.reduce((s, row) => s + row.vatAmount, 0) + selfAssessedVat + importVat);
    const deductibleInputVat = round2(rawInputVat * (Number(config.inputVatDeductibilityPercent || 100) / 100));

    return {
      period: filter,
      status: 'PREVIEW',
      config,
      disclaimer: 'Preliquidación de control. No sustituye el Modelo 303 oficial. Los ajustes de prorrata, bienes de inversión, regularizaciones, cuotas a compensar, importaciones diferidas y otras casillas especiales deben validarse antes de presentar.',
      accrued: {
        domesticByRate: this.byRate(domesticIssued),
        outputVat,
        equivalenceSurcharge: outputSurcharge,
        selfAssessedVat,
        intraCommunitySupplyBase: round2(intraSupply.reduce((s, row) => s + row.taxableBase, 0)),
        exportBase: round2(exports.reduce((s, row) => s + row.taxableBase, 0)),
        exemptBase: round2(exemptIssued.reduce((s, row) => s + row.taxableBase, 0)),
        notSubjectBase: round2(notSubjectIssued.reduce((s, row) => s + row.taxableBase, 0)),
      },
      deductible: {
        domesticByRate: this.byRate(domesticReceived),
        domesticInputVat: round2(domesticReceived.reduce((s, row) => s + row.vatAmount, 0)),
        intraCommunitySelfAssessedVat: selfAssessedVat,
        importVat,
        deductibilityPercent: config.inputVatDeductibilityPercent,
        inputVat: deductibleInputVat,
      },
      recc: {
        enabled: config.reccEnabled,
        note: config.reccEnabled ? 'Las facturas nacionales ordinarias se imputan proporcionalmente a cobros/pagos registrados en el período. Las rectificaciones deben revisarse en el cierre RECC.' : 'Criterio general de devengo.',
      },
      result: {
        accruedTax: round2(outputVat + outputSurcharge + selfAssessedVat),
        deductibleTax: deductibleInputVat,
        difference: round2(outputVat + outputSurcharge + selfAssessedVat - deductibleInputVat),
      },
    };
  }

  public async model349Preview(filter: SpanishFiscalReportsQueryDto) {
    const books = await this.vatBooks(filter);
    const rows = [...books.issued, ...books.received].filter((row) => row.taxTerritory === 'iva' && Boolean(model349Code(row.operationType)));
    const groups = new Map<string, any>();
    rows.forEach((row) => {
      const code = model349Code(row.operationType);
      const tax = String(row.counterpartyFiscalNumber || '').replace(/\s+/g, '').toUpperCase();
      const country = String(row.counterpartyCountry || '').toUpperCase();
      const key = `${code}|${country}|${tax}`;
      const current = groups.get(key) || {
        operationCode: code,
        countryCode: country,
        vatNumber: tax,
        counterpartyName: row.counterpartyName || '',
        viesStatus: row.viesStatus || 'unknown',
        taxableBase: 0,
        documents: 0,
      };
      current.taxableBase = round2(current.taxableBase + row.taxableBase);
      current.documents += 1;
      groups.set(key, current);
    });
    const data = [...groups.values()].filter((r) => Math.abs(r.taxableBase) > 0.004);
    const totalSupplies = round2(data.filter((r) => ['E', 'S'].includes(r.operationCode)).reduce((s, r) => s + r.taxableBase, 0));
    return {
      period: filter,
      status: 'PREVIEW',
      periodicityHint: Math.abs(totalSupplies) > 50000 ? 'monthly' : 'quarterly-eligible',
      thresholdForQuarterly: 50000,
      data,
      warnings: data.filter((r) => !r.vatNumber || r.viesStatus !== 'valid').map((r) => ({
        operationCode: r.operationCode,
        vatNumber: r.vatNumber,
        message: !r.vatNumber ? 'Falta NIF-IVA del operador.' : 'NIF-IVA sin evidencia VIES válida registrada.',
      })),
      totals: {
        operators: data.length,
        taxableBase: round2(data.reduce((s, r) => s + r.taxableBase, 0)),
      },
    };
  }

  public async model347Preview(filter: SpanishFiscalReportsQueryDto) {
    const [books, config] = await Promise.all([this.vatBooks(filter), this.settings.getConfig()]);
    if (config.siiEnabled) {
      return {
        period: filter,
        status: 'NOT_REQUIRED_BY_SII',
        obligation: false,
        threshold: config.model347Threshold,
        data: [],
        disclaimer: 'La empresa está marcada como SII. Los obligados que llevan los libros de IVA mediante SII durante todo el ejercicio están excluidos del Modelo 347.',
      };
    }
    const excluded = new Set<SpanishOperationType>([
      'intra_community_goods_supply', 'intra_community_goods_acquisition',
      'intra_community_service_supply', 'intra_community_service_acquisition',
      'export', 'import', 'oss', 'ioss',
    ]);
    const groups = new Map<string, any>();
    const push = (row: SpanishVatBookRow, keyCode: 'A' | 'B') => {
      if (excluded.has(row.operationType)) return;
      const tax = String(row.counterpartyFiscalNumber || '').trim().toUpperCase();
      if (!tax) return;
      const key = `${keyCode}|${tax}`;
      const amount = round2(row.taxableBase + row.vatAmount + row.equivalenceSurchargeAmount);
      const current = groups.get(key) || {
        key: keyCode,
        taxNumber: tax,
        name: row.counterpartyName || '',
        countryCode: row.counterpartyCountry || 'ES',
        annualAmount: 0,
        quarters: { T1: 0, T2: 0, T3: 0, T4: 0 },
      };
      current.annualAmount = round2(current.annualAmount + amount);
      const q = quarter(row.date);
      current.quarters[q] = round2(current.quarters[q] + amount);
      groups.set(key, current);
    };
    books.issued.forEach((row) => push(row, 'B'));
    books.received.forEach((row) => push(row, 'A'));
    const data = [...groups.values()].filter((row) => Math.abs(row.annualAmount) > config.model347Threshold);
    return {
      period: filter,
      status: 'PREVIEW',
      obligation: true,
      threshold: config.model347Threshold,
      data,
      disclaimer: 'Control previo basado en facturas/abonos registrados. Deben revisarse las exclusiones específicas del artículo 33 RGAT, subvenciones, alquileres y operaciones especiales antes de la presentación oficial.',
      totals: { declaredParties: data.length, amount: round2(data.reduce((s, r) => s + r.annualAmount, 0)) },
    };
  }

  public async model369Preview(filter: SpanishFiscalReportsQueryDto) {
    const [books, config] = await Promise.all([this.vatBooks(filter), this.settings.getConfig()]);
    const rows = books.issued.filter((row) => row.taxTerritory === 'iva' && (row.operationType === 'oss' || row.operationType === 'ioss'));
    const groups = new Map<string, any>();
    rows.forEach((row) => {
      const scheme = row.operationType === 'ioss' ? 'import' : (row.ossScheme || 'union');
      const country = String(row.counterpartyCountry || '').toUpperCase();
      const key = `${scheme}|${country}|${row.vatRate}`;
      const current = groups.get(key) || { scheme, countryCode: country, vatRate: row.vatRate, taxableBase: 0, vatAmount: 0 };
      current.taxableBase = round2(current.taxableBase + row.taxableBase);
      current.vatAmount = round2(current.vatAmount + row.vatAmount);
      groups.set(key, current);
    });
    return {
      period: filter,
      status: 'PREVIEW',
      config: { ossUnionEnabled: config.ossUnionEnabled, ossNonUnionEnabled: config.ossNonUnionEnabled, iossEnabled: config.iossEnabled },
      data: [...groups.values()],
      totals: {
        taxableBase: round2(rows.reduce((s, r) => s + r.taxableBase, 0)),
        vatAmount: round2(rows.reduce((s, r) => s + r.vatAmount, 0)),
      },
      disclaimer: 'Preliquidación de control para Modelo 369. Requiere alta censal previa en el régimen OSS/IOSS aplicable y validación de país de consumo, tipo de IVA destino y correcciones de períodos anteriores.',
    };
  }

  public async exportCsv(report: 'vat-issued' | 'vat-received' | '349' | '347' | '369', filter: SpanishFiscalReportsQueryDto) {
    let rows: Record<string, unknown>[] = [];
    if (report === 'vat-issued' || report === 'vat-received') {
      const books = await this.vatBooks(filter);
      rows = (report === 'vat-issued' ? books.issued : books.received) as any;
    } else if (report === '349') rows = (await this.model349Preview(filter)).data;
    else if (report === '347') rows = (await this.model347Preview(filter)).data;
    else rows = (await this.model369Preview(filter)).data;
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => typeof row[key] !== 'object')))];
    const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const content = [headers.map(esc).join(';'), ...rows.map((row) => headers.map((h) => esc(row[h])).join(';'))].join('\n');
    return { filename: `${report}-${filter.fromDate || 'inicio'}-${filter.toDate || 'fin'}.csv`, content, contentType: 'text/csv;charset=utf-8' };
  }
}
