import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { calculateSpanishInvoiceFiscal } from '@farocapital/utils';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { Customer } from '@/modules/Customers/models/Customer';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import {
  isValidSpanishFiscalNumber,
  normalizeSpanishFiscalNumber,
} from '@/modules/SpainFiscal/SpanishFiscalNumber';
import {
  VerifactuBreakdown,
  VerifactuEvent,
  VerifactuRecordData,
  VerifactuPreviousRecord,
} from './Verifactu.types';
import { calculateVerifactuHash } from './lib/VerifactuHash';
import { formatAeatDate, formatAeatTimestamp } from './lib/VerifactuTime';
import { buildVerifactuQrUrl } from './lib/VerifactuQr';
import {
  renderVerifactuEnvelope,
  renderVerifactuRecordXml,
} from './lib/VerifactuXml';
import {
  VerifactuRuntimeSettings,
  VerifactuSettingsService,
} from './VerifactuSettings.service';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class VerifactuRecordService {
  constructor(
    private readonly settings: VerifactuSettingsService,
    private readonly tenancyContext: TenancyContext,
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  async isEnabled(): Promise<boolean> {
    return (await this.settings.getRuntimeSettings()).effectiveEnabled;
  }

  async loadInvoice(invoiceId: number, trx?: Knex.Transaction): Promise<SaleInvoice> {
    return this.saleInvoiceModel()
      .query(trx)
      .findById(invoiceId)
      .withGraphFetched('entries')
      .throwIfNotFound();
  }

  /**
   * Creates an immutable fiscal record plus its persistent outbox row inside
   * the caller transaction. No Redis/network operation occurs here.
   */
  async createRecord(
    invoice: SaleInvoice,
    event: VerifactuEvent,
    trx: Knex.Transaction,
    options: { rejectionPrevious?: boolean } = {},
  ): Promise<number | null> {
    const runtimeSettings = await this.settings.getRuntimeSettings();
    if (!runtimeSettings.effectiveEnabled) return null;

    const invoiceId = Number(invoice.id);
    const existing = await trx('verifactu_records')
      .where({ sale_invoice_id: invoiceId, event })
      .orderBy('record_version', 'desc')
      .first();

    if (event === 'alta' && existing) return Number(existing.id);

    if (event === 'anulacion' && existing) {
      const dispatch = await trx('verifactu_dispatch')
        .where({ record_id: existing.id })
        .first('state');
      // Pending or accepted cancellation is idempotent. A rejected/failed one
      // requires an explicit RechazoPrevio=S before a new immutable record.
      if (dispatch && dispatch.state !== 'failed') return Number(existing.id);
      if (!options.rejectionPrevious) {
        throw new Error('VERIFACTU_ANULACION_REJECTED_REQUIRES_RECHAZO_PREVIO');
      }
    }

    if (event !== 'alta') {
      const alta = await trx('verifactu_records')
        .where({ sale_invoice_id: invoiceId, event: 'alta' })
        .first();
      if (!alta) throw new Error('VERIFACTU_REQUIRES_PREVIOUS_ALTA');
    }
    if (event === 'subsanacion') {
      const pendingCorrection = await trx('verifactu_records as r')
        .join('verifactu_dispatch as d', 'd.record_id', 'r.id')
        .where('r.sale_invoice_id', invoiceId)
        .where('r.event', 'subsanacion')
        .whereIn('d.state', ['pending', 'processing', 'retry'])
        .first('r.id');
      if (pendingCorrection) {
        throw new Error('VERIFACTU_SUBSANACION_PENDING');
      }
    }

    // Serialize the global chain with a single-row FOR UPDATE lock.
    const chain = await trx('verifactu_chain_state')
      .where({ id: 1 })
      .forUpdate()
      .first();
    if (!chain) throw new Error('VERIFACTU_CHAIN_STATE_NOT_INITIALIZED');

    const previousRow = chain.last_record_id
      ? await trx('verifactu_records').where({ id: chain.last_record_id }).first()
      : null;
    const previous = previousRow
      ? this.previousFromRow(previousRow)
      : undefined;

    const customer = await this.customerModel()
      .query(trx)
      .findById(invoice.customerId)
      .throwIfNotFound();
    const data = await this.buildRecordData(
      invoice,
      customer,
      event,
      previous,
      options,
      runtimeSettings,
    );

    const hash = calculateVerifactuHash({
      event,
      issuerNif: data.issuerNif,
      invoiceNo: data.invoiceNo,
      invoiceDate: data.invoiceDate,
      invoiceType: data.invoiceType,
      taxTotal: data.taxTotal,
      invoiceTotal: data.invoiceTotal,
      previousHash: previous?.hash || '',
      generationTimestamp: data.generationTimestamp,
    });
    const recordXml = renderVerifactuRecordXml(data, hash);
    const payloadXml = renderVerifactuEnvelope({
      issuerName: data.issuerName,
      issuerNif: data.issuerNif,
      recordXml,
    });
    this.prevalidate(data, hash, payloadXml);

    const recordVersion =
      event === 'subsanacion' || event === 'anulacion'
        ? Number(existing?.record_version || 0) + 1
        : 1;
    const qrUrl =
      event === 'anulacion'
        ? null
        : buildVerifactuQrUrl({
            endpoint: runtimeSettings.qrEndpoint,
            issuerNif: data.issuerNif,
            invoiceNo: data.invoiceNo,
            invoiceDate: invoice.invoiceDate,
            invoiceTotal: data.invoiceTotal,
          });

    const [recordId] = await trx('verifactu_records').insert({
      sale_invoice_id: invoiceId,
      event,
      record_version: recordVersion,
      issuer_nif: data.issuerNif,
      invoice_no: data.invoiceNo,
      invoice_date: this.toDatabaseDate(invoice.invoiceDate),
      generation_timestamp: data.generationTimestamp,
      invoice_type: data.invoiceType,
      tax_total: data.taxTotal,
      invoice_total: data.invoiceTotal,
      previous_record_id: previous?.id || null,
      previous_hash: previous?.hash || null,
      hash_type: '01',
      hash,
      qr_url: qrUrl,
      payload_json: JSON.stringify({ ...data, hash }, null, 2),
      payload_xml: payloadXml,
      aeat_status: 'pending',
    });

    await trx('verifactu_dispatch').insert({
      record_id: recordId,
      state: 'pending',
      attempts: 0,
      next_attempt_at: trx.fn.now(),
    });
    await trx('verifactu_chain_state')
      .where({ id: 1 })
      .update({ last_record_id: recordId, last_hash: hash, updated_at: trx.fn.now() });

    return Number(recordId);
  }

  private async buildRecordData(
    invoice: SaleInvoice,
    customer: Customer,
    event: VerifactuEvent,
    previous: VerifactuPreviousRecord | undefined,
    options: { rejectionPrevious?: boolean },
    runtimeSettings: VerifactuRuntimeSettings,
  ): Promise<VerifactuRecordData> {
    const metadata = await this.tenancyContext.getTenantMetadata();
    const issuerNif = normalizeSpanishFiscalNumber(metadata?.taxNumber || '');
    if (!issuerNif || !isValidSpanishFiscalNumber(issuerNif)) {
      throw new Error('VERIFACTU_INVALID_ORGANIZATION_NIF');
    }
    const issuerName = String(metadata?.name || '').trim();
    if (!issuerName) throw new Error('VERIFACTU_ORGANIZATION_NAME_REQUIRED');

    const producerNif = normalizeSpanishFiscalNumber(
      runtimeSettings.producerTaxNumber,
    );
    if (!producerNif || !isValidSpanishFiscalNumber(producerNif)) {
      throw new Error('VERIFACTU_INVALID_PRODUCER_NIF');
    }

    const invoiceType = invoice.aeatInvoiceType === 'F2' ? 'F2' : 'F1';
    const customerFiscalCountry = String(customer.fiscalCountry || 'ES').toUpperCase();
    const customerNif = String(customer.fiscalNumber || '').trim().toUpperCase();
    if (event !== 'anulacion' && invoiceType !== 'F2') {
      if (!customer.displayName || !customerNif) {
        throw new Error('VERIFACTU_RECIPIENT_FISCAL_DATA_REQUIRED');
      }
      if (customerFiscalCountry === 'ES' && !isValidSpanishFiscalNumber(customerNif)) {
        throw new Error('VERIFACTU_INVALID_RECIPIENT_NIF');
      }
      if (customerFiscalCountry !== 'ES' && !customer.aeatIdType) {
        throw new Error('VERIFACTU_FOREIGN_RECIPIENT_ID_TYPE_REQUIRED');
      }
    }

    const breakdowns = event === 'anulacion' ? [] : this.buildBreakdowns(invoice);
    const taxTotal = round2(
      breakdowns.reduce(
        (sum, row) =>
          sum +
          Number(row.cuotaRepercutida || 0) +
          Number(row.cuotaRecargoEquivalencia || 0),
        0,
      ),
    );
    const invoiceTotal = round2(
      breakdowns.reduce((sum, row) => sum + row.base, 0) + taxTotal,
    );

    return {
      event,
      issuerNif,
      issuerName,
      invoiceNo: String(invoice.invoiceNo || '').trim().slice(0, 60),
      invoiceDate: formatAeatDate(invoice.invoiceDate),
      invoiceType,
      customerName: customer.displayName,
      customerNif:
        customerFiscalCountry === 'ES'
          ? normalizeSpanishFiscalNumber(customerNif)
          : customerNif,
      customerCountry: customerFiscalCountry,
      customerAeatIdType: customer.aeatIdType,
      description: String((invoice as any).invoiceMessage || 'Venta de productos o servicios'),
      breakdowns,
      taxTotal,
      invoiceTotal,
      generationTimestamp: formatAeatTimestamp(new Date(), 'Europe/Madrid'),
      previous,
      rejectionPrevious: options.rejectionPrevious,
      system: {
        producerName: runtimeSettings.producerName,
        producerTaxNumber: producerNif,
        systemName: runtimeSettings.systemName,
        systemId: runtimeSettings.systemId.slice(0, 2),
        version: runtimeSettings.systemVersion,
        installationNumber: runtimeSettings.installationNumber,
      },
    };
  }

  private buildBreakdowns(invoice: SaleInvoice): VerifactuBreakdown[] {
    const entries = invoice.entries || [];
    if (!entries.length) throw new Error('VERIFACTU_INVOICE_LINES_REQUIRED');

    const fiscal = calculateSpanishInvoiceFiscal({
      lines: entries.map((rawEntry) => {
        const entry = ItemEntry.fromJson(rawEntry as any);
        return {
          quantity: Number(entry.quantity || 0),
          rate: Number(entry.rate || 0),
          lineDiscountType: entry.discountType,
          lineDiscount: Number(entry.discount || 0),
          vatRate: Number(entry.taxRate || 0),
          isInclusiveTax: Boolean(entry.isInclusiveTax ?? invoice.isInclusiveTax),
          fiscalRegime: entry.fiscalRegime || 'standard',
          equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
          retentionRate: Number(entry.retentionRate || 0),
        };
      }),
      documentDiscountType: invoice.discountType,
      documentDiscount: Number(invoice.discount || 0),
      documentAdjustment: Number(invoice.adjustment || 0),
    });

    const groups = new Map<string, VerifactuBreakdown>();

    entries.forEach((rawEntry, index) => {
      const entry = ItemEntry.fromJson(rawEntry as any);
      const line = fiscal.lines[index];
      const vatRate = Number(entry.taxRate || 0);
      const regime = String(entry.fiscalRegime || 'standard');
      const qualification = (entry.aeatOperationQualification ||
        (regime === 'reverse_charge'
          ? 'S2'
          : regime === 'not_subject'
            ? 'N1'
            : regime === 'exempt'
              ? undefined
              : 'S1')) as VerifactuBreakdown['calificacionOperacion'];
      const exemption = (entry.aeatExemptionCause ||
        (regime === 'exempt' ? 'E1' : undefined)) as VerifactuBreakdown['operacionExenta'];
      const subject = !exemption && !['N1', 'N2'].includes(String(qualification || ''));
      const surchargeRate = subject && qualification === 'S1'
        ? Number(entry.equivalenceSurchargeRate || 0)
        : 0;
      const key = [
        entry.aeatTaxCode || '01',
        entry.aeatRegimeKey || '01',
        qualification || '',
        exemption || '',
        vatRate.toFixed(4),
        surchargeRate.toFixed(4),
      ].join('|');
      const current = groups.get(key) || {
        impuesto: entry.aeatTaxCode || '01',
        claveRegimen: entry.aeatRegimeKey || '01',
        calificacionOperacion: qualification,
        operacionExenta: exemption,
        tipoImpositivo: subject ? vatRate : undefined,
        base: 0,
        cuotaRepercutida: subject ? 0 : undefined,
        tipoRecargoEquivalencia: surchargeRate || undefined,
        cuotaRecargoEquivalencia: surchargeRate ? 0 : undefined,
      };

      current.base = round2(current.base + Number(line?.taxableBase || 0));
      if (subject) {
        current.cuotaRepercutida = round2(
          Number(current.cuotaRepercutida || 0) +
            (qualification === 'S2' ? 0 : Number(line?.vatAmount || 0)),
        );
      }
      if (surchargeRate) {
        current.cuotaRecargoEquivalencia = round2(
          Number(current.cuotaRecargoEquivalencia || 0) +
            Number(line?.equivalenceSurchargeAmount || 0),
        );
      }
      groups.set(key, current);
    });

    return [...groups.values()];
  }

  private prevalidate(data: VerifactuRecordData, hash: string, xml: string): void {
    if (!data.invoiceNo) throw new Error('VERIFACTU_INVOICE_NUMBER_REQUIRED');
    if (!/^[A-F0-9]{64}$/.test(hash)) throw new Error('VERIFACTU_INVALID_HASH');
    if (data.event !== 'anulacion' && data.breakdowns.length === 0) {
      throw new Error('VERIFACTU_BREAKDOWN_REQUIRED');
    }
    if (!xml.includes('<sfLR:RegFactuSistemaFacturacion')) {
      throw new Error('VERIFACTU_INVALID_XML_ROOT');
    }
    if (Buffer.byteLength(xml, 'utf8') > 10 * 1024 * 1024) {
      throw new Error('VERIFACTU_XML_TOO_LARGE');
    }
  }

  private previousFromRow(row: any): VerifactuPreviousRecord {
    return {
      id: Number(row.id),
      issuerNif: row.issuer_nif,
      invoiceNo: row.invoice_no,
      invoiceDate: formatAeatDate(row.invoice_date),
      hash: row.hash,
    };
  }

  private toDatabaseDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('VERIFACTU_INVALID_INVOICE_DATE');
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
