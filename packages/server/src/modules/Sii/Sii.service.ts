import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import https from 'https';
import { Knex } from 'knex';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { SpanishFiscalReportsService, SpanishVatBookRow } from '@/modules/SpainFiscalReports/SpanishFiscalReports.service';
import { SpanishFiscalSettingsService } from '@/modules/SpainFiscalReports/SpanishFiscalSettings.service';
import { SiiSettingsService } from './SiiSettings.service';
import { SiiPeriodDto, UpdateSiiConfigDto } from './dtos/Sii.dto';
import { renderSiiInvoiceEnvelope, renderSiiPaymentEnvelope, SiiInvoicePayload } from './lib/SiiXml';

const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const round2 = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const isoDate = (value: unknown) => String(value || '').slice(0, 10);
const periodParts = (value: string) => ({ year: value.slice(0, 4), month: value.slice(5, 7) });

@Injectable()
export class SiiService {
  constructor(
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
    private readonly tenancyContext: TenancyContext,
    private readonly reports: SpanishFiscalReportsService,
    private readonly fiscalSettings: SpanishFiscalSettingsService,
    private readonly siiSettings: SiiSettingsService,
  ) {}

  private async issuer() {
    const metadata: any = await this.tenancyContext.getTenantMetadata();
    const name = String(metadata?.name || '').trim();
    const taxNumber = String(metadata?.taxNumber || '').replace(/\s+/g, '').toUpperCase();
    if (!name || !taxNumber) {
      throw new BadRequestException('SII_ORGANIZATION_FISCAL_IDENTITY_REQUIRED');
    }
    return { name, taxNumber, countryCode: 'ES' };
  }

  private groupRows(rows: SpanishVatBookRow[]) {
    const groups = new Map<string, SpanishVatBookRow[]>();
    rows.forEach((row) => {
      if (row.documentType === 'Expense' || row.taxTerritory !== 'iva') return;
      const key = `${row.documentType}:${row.documentId}`;
      groups.set(key, [...(groups.get(key) || []), row]);
    });
    return groups;
  }

  private invoicePayload(rows: SpanishVatBookRow[], issuer: { name: string; taxNumber: string; countryCode: string }): SiiInvoicePayload {
    const first = rows[0];
    const { year, month } = periodParts(first.date);
    const direction = ['SaleInvoice', 'CreditNote'].includes(first.documentType) ? 'issued' : 'received';
    const counterparty = first.counterpartyFiscalNumber
      ? {
          name: first.counterpartyName || first.counterpartyFiscalNumber,
          taxNumber: first.counterpartyFiscalNumber,
          countryCode: first.counterpartyCountry || 'ES',
        }
      : undefined;
    const total = round2(rows.reduce((sum, row) =>
      sum + row.taxableBase + row.vatAmount + row.equivalenceSurchargeAmount, 0));
    const invoiceType = ['CreditNote', 'VendorCredit'].includes(first.documentType) ? 'R1' : 'F1';
    return {
      direction,
      issuer,
      counterparty,
      invoiceNumber: first.documentNumber,
      invoiceDate: first.date,
      operationDate: first.date,
      accountingDate: first.date,
      invoiceType,
      description: invoiceType.startsWith('R') ? `Factura rectificativa ${first.documentNumber}` : `Factura ${first.documentNumber}`,
      periodYear: year,
      periodMonth: month,
      regimeKey: first.aeatRegimeKey || '01',
      total,
      deductibleVat: round2(rows.reduce((sum, row) => sum + row.vatAmount, 0)),
      lines: rows.map((row) => ({
        rate: row.vatRate,
        base: row.taxableBase,
        vat: row.vatAmount,
        surcharge: row.equivalenceSurchargeAmount,
        surchargeRate: row.equivalenceSurchargeRate,
        regimeKey: row.aeatRegimeKey,
        qualification: row.aeatOperationQualification,
        exemptionCause: row.aeatExemptionCause,
        operationType: row.operationType,
      })),
    };
  }

  private async persistRecord(record: any) {
    const knex = this.tenantKnex();
    const existing = await knex('sii_records')
      .where({ record_kind: record.record_kind, source_type: record.source_type, source_id: record.source_id })
      .first();
    if (existing && (Number(existing.attempts || 0) > 0 || ['submitted', 'accepted', 'accepted_with_errors', 'rejected'].includes(existing.status))) {
      // Once transport has been attempted, the generated payload is immutable.
      // A retry always resends the same XML/SHA rather than regenerating history.
      return existing;
    }
    if (existing) {
      await knex('sii_records').where({ id: existing.id }).update({ ...record, updated_at: knex.fn.now() });
      return knex('sii_records').where({ id: existing.id }).first();
    }
    const result = await knex('sii_records').insert({
      ...record,
      attempts: 0,
      generated_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    const id = Array.isArray(result) ? Number(result[0]) : Number(result);
    return knex('sii_records').where({ id }).first();
  }

  private async generateInvoices(period: SiiPeriodDto) {
    const [issuer, books] = await Promise.all([this.issuer(), this.reports.vatBooks(period)]);
    const records: any[] = [];
    for (const rows of [...this.groupRows(books.issued).values(), ...this.groupRows(books.received).values()]) {
      if (!rows.length) continue;
      const payload = this.invoicePayload(rows, issuer);
      const xml = renderSiiInvoiceEnvelope(payload);
      const first = rows[0];
      records.push(await this.persistRecord({
        record_kind: payload.direction === 'issued' ? 'issued_invoice' : 'received_invoice',
        source_type: first.documentType,
        source_id: first.documentId,
        source_number: first.documentNumber,
        period_year: payload.periodYear,
        period_month: payload.periodMonth,
        counterparty_name: first.counterpartyName || null,
        counterparty_tax_number: first.counterpartyFiscalNumber || null,
        special_regime_key: payload.regimeKey || null,
        status: 'generated',
        payload_json: JSON.stringify(payload),
        payload_xml: xml,
        payload_sha256: sha256(xml),
        response_xml: null,
        aeat_csv: null,
        error_code: null,
        error_message: null,
        submitted_at: null,
        accepted_at: null,
        rejected_at: null,
      }));
    }
    return records;
  }

  private async generateReccPayments(period: SiiPeriodDto) {
    const config = await this.fiscalSettings.getConfig();
    if (!config.reccEnabled) return [];
    const issuer = await this.issuer();
    const knex = this.tenantKnex();
    const receiveQuery = knex('payment_receives_entries as e')
      .join('payment_receives as p', 'p.id', 'e.payment_receive_id')
      .join('sales_invoices as i', 'i.id', 'e.invoice_id')
      .leftJoin('contacts as c', 'c.id', 'i.customer_id')
      .select(
        'e.id as source_id', 'e.payment_amount as amount', 'p.payment_date',
        'p.aeat_payment_method', 'p.aeat_payment_reference',
        'i.id as invoice_id', 'i.invoice_no', 'i.invoice_date',
        'c.fiscal_number as counterparty_tax_number', 'c.display_name as counterparty_name',
      );
    const payQuery = knex('bills_payments_entries as e')
      .join('bills_payments as p', 'p.id', 'e.bill_payment_id')
      .join('bills as b', 'b.id', 'e.bill_id')
      .leftJoin('contacts as c', 'c.id', 'b.vendor_id')
      .select(
        'e.id as source_id', 'e.payment_amount as amount', 'p.payment_date',
        'p.aeat_payment_method', 'p.aeat_payment_reference',
        'b.id as invoice_id', 'b.bill_number as invoice_no', 'b.bill_date as invoice_date',
        'c.fiscal_number as counterparty_tax_number', 'c.display_name as counterparty_name',
      );
    for (const query of [receiveQuery, payQuery]) {
      if (period.fromDate) query.where('p.payment_date', '>=', period.fromDate);
      if (period.toDate) query.where('p.payment_date', '<=', period.toDate);
    }
    const [receipts, payments] = await Promise.all([receiveQuery, payQuery]);
    const generated: any[] = [];
    for (const [direction, rows] of [['issued', receipts], ['received', payments]] as const) {
      for (const row of rows as any[]) {
        const paymentDate = isoDate(row.payment_date);
        const invoiceDate = isoDate(row.invoice_date);
        const { year, month } = periodParts(invoiceDate || paymentDate);
        const invoiceIssuerTaxNumber = direction === 'issued'
          ? issuer.taxNumber
          : String(row.counterparty_tax_number || '').trim();
        if (!invoiceIssuerTaxNumber) continue;
        const payload = {
          direction,
          issuer,
          invoiceIssuerTaxNumber,
          invoiceIssuerName: direction === 'received' ? String(row.counterparty_name || invoiceIssuerTaxNumber) : undefined,
          invoiceIssuerCountryCode: 'ES',
          invoiceNumber: String(row.invoice_no || ''),
          invoiceDate,
          paymentDate,
          amount: Number(row.amount || 0),
          methodCode: String(row.aeat_payment_method || '04'),
          bankReference: row.aeat_payment_reference || undefined,
          periodYear: year,
          periodMonth: month,
        } as const;
        const xml = renderSiiPaymentEnvelope(payload);
        generated.push(await this.persistRecord({
          record_kind: direction === 'issued' ? 'issued_payment' : 'received_payment',
          source_type: direction === 'issued' ? 'PaymentReceiveEntry' : 'BillPaymentEntry',
          source_id: Number(row.source_id),
          source_number: String(row.invoice_no || ''),
          period_year: year,
          period_month: month,
          counterparty_name: row.counterparty_name || null,
          counterparty_tax_number: row.counterparty_tax_number || null,
          special_regime_key: '07',
          status: 'generated',
          payload_json: JSON.stringify(payload),
          payload_xml: xml,
          payload_sha256: sha256(xml),
          response_xml: null,
          aeat_csv: null,
          error_code: null,
          error_message: null,
          submitted_at: null,
          accepted_at: null,
          rejected_at: null,
        }));
      }
    }
    return generated;
  }

  async sync(period: SiiPeriodDto) {
    const runtime = await this.siiSettings.getRuntimeConfig();
    if (!runtime.enabled) throw new BadRequestException('SII_NOT_ENABLED');
    const [invoices, payments] = await Promise.all([
      this.generateInvoices(period),
      this.generateReccPayments(period),
    ]);
    return { generated: invoices.length + payments.length, invoices: invoices.length, payments: payments.length };
  }

  async list(query: Record<string, string>) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25));
    const knex = this.tenantKnex();
    const base = knex('sii_records');
    if (query.status) base.where('status', query.status);
    if (query.kind) base.where('record_kind', query.kind);
    if (query.search) {
      const search = `%${query.search}%`;
      base.where((q) => q.where('source_number', 'like', search).orWhere('counterparty_name', 'like', search).orWhere('counterparty_tax_number', 'like', search));
    }
    const totalRow = await base.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    const total = Number((totalRow as any)?.count || 0);
    const data = await base.clone().select('*').orderBy('id', 'desc').limit(pageSize).offset((page - 1) * pageSize);
    return { data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
  }

  async get(id: number) {
    const row = await this.tenantKnex()('sii_records').where({ id }).first();
    if (!row) throw new NotFoundException('SII_RECORD_NOT_FOUND');
    return row;
  }

  private endpointFor(kind: string, endpoints: Record<string, string>) {
    if (kind === 'issued_invoice') return endpoints.issued;
    if (kind === 'received_invoice') return endpoints.received;
    if (kind === 'issued_payment') return endpoints.issuedPayment;
    if (kind === 'received_payment') return endpoints.receivedPayment;
    return '';
  }

  private responseState(xml: string) {
    const find = (tag: string) => new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)<\\/(?:\\w+:)?${tag}>`, 'i').exec(xml)?.[1]?.trim();
    const state = find('EstadoEnvio') || find('EstadoRegistro') || '';
    const csv = find('CSV') || '';
    const errorCode = find('CodigoErrorRegistro') || find('CodigoError') || '';
    const errorMessage = find('DescripcionErrorRegistro') || find('DescripcionError') || '';
    const normalized = state.toLowerCase();
    const status = /correcto|aceptado/.test(normalized)
      ? (/parcial|con errores/.test(normalized) ? 'accepted_with_errors' : 'accepted')
      : /incorrecto|rechazado/.test(normalized) ? 'rejected' : 'submitted';
    return { state, csv, errorCode, errorMessage, status };
  }

  async submit(id: number) {
    const row = await this.get(id);
    if (row.status === 'accepted') return row;
    const runtime = await this.siiSettings.getRuntimeConfig();
    if (!runtime.enabled) throw new BadRequestException('SII_NOT_ENABLED');
    const endpoint = this.endpointFor(row.record_kind, runtime.endpoints as any);
    if (!endpoint) throw new BadRequestException('SII_ENDPOINT_NOT_CONFIGURED');
    if (!runtime.certificatePath) throw new BadRequestException('SII_CERTIFICATE_PATH_REQUIRED');
    const knex = this.tenantKnex();
    const attempts = Number(row.attempts || 0) + 1;
    await knex('sii_records').where({ id }).update({ attempts, status: 'submitting', error_code: null, error_message: null, updated_at: knex.fn.now() });
    try {
      const agent = new https.Agent({
        pfx: readFileSync(runtime.certificatePath),
        passphrase: runtime.passphrase || undefined,
        rejectUnauthorized: true,
      });
      const response = await axios.post(endpoint, row.payload_xml, {
        httpsAgent: agent,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        timeout: 30000,
        responseType: 'text',
        validateStatus: () => true,
      });
      const responseXml = String(response.data || '');
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP_${response.status}: ${responseXml.slice(0, 500)}`);
      }
      const parsed = this.responseState(responseXml);
      const now = knex.fn.now();
      await knex('sii_records').where({ id }).update({
        status: parsed.status,
        response_xml: responseXml,
        aeat_csv: parsed.csv || null,
        error_code: parsed.errorCode || null,
        error_message: parsed.errorMessage || null,
        submitted_at: now,
        accepted_at: parsed.status === 'accepted' ? now : null,
        rejected_at: parsed.status === 'rejected' ? now : null,
        updated_at: now,
      });
    } catch (error: any) {
      await knex('sii_records').where({ id }).update({
        status: 'failed',
        error_code: error?.code || 'SII_TRANSPORT_ERROR',
        error_message: String(error?.message || error).slice(0, 2000),
        updated_at: knex.fn.now(),
      });
    }
    return this.get(id);
  }

  retry(id: number) { return this.submit(id); }
  getConfig() { return this.siiSettings.getPublicConfig(); }
  updateConfig(input: UpdateSiiConfigDto) { return this.siiSettings.save(input); }
}
