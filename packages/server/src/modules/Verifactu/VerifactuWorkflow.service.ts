import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { VerifactuRecordService } from './VerifactuRecord.service';
import { VerifactuDispatcher } from './VerifactuDispatcher.service';
import { VerifactuAeatClient } from './VerifactuAeatClient.service';
import { VerifactuSettingsService } from './VerifactuSettings.service';
import { CreateVerifactuAnulacionDto, CreateVerifactuSubsanacionDto } from './dtos/Verifactu.dto';
import { UpdateVerifactuConfigDto } from './dtos/VerifactuConfig.dto';
import { formatAeatDate } from './lib/VerifactuTime';

@Injectable()
export class VerifactuWorkflowService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly records: VerifactuRecordService,
    private readonly dispatcher: VerifactuDispatcher,
    private readonly aeat: VerifactuAeatClient,
    private readonly settings: VerifactuSettingsService,
    private readonly eventsEmitter: EventEmitter2,
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
  ) {}

  getConfig() {
    return this.settings.getPublicConfig();
  }

  updateConfig(input: UpdateVerifactuConfigDto) {
    return this.settings.saveTenantSettings(input);
  }

  validateCertificate() {
    return this.aeat.validateCertificate();
  }

  async createSubsanacion(
    invoiceId: number,
    options: CreateVerifactuSubsanacionDto = {},
  ) {
    await this.ensureEffective();
    const recordId = await this.uow.withTransaction(async (trx) => {
      const locked = await trx('sales_invoices')
        .where({ id: invoiceId })
        .forUpdate()
        .first(['id', 'delivered_at']);
      if (!locked) throw new Error('SALE_INVOICE_NOT_FOUND');
      if (!locked.delivered_at) throw new Error('VERIFACTU_INVOICE_NOT_DELIVERED');

      if (options.refreshTaxClassification) {
        await trx.raw(
          `UPDATE items_entries e
           INNER JOIN tax_rates t ON t.id = e.tax_rate_id
           SET e.fiscal_regime = t.fiscal_regime,
               e.equivalence_surcharge_rate = t.equivalence_surcharge_rate,
               e.retention_rate = t.retention_rate,
               e.aeat_tax_code = t.aeat_tax_code,
               e.aeat_regime_key = t.aeat_regime_key,
               e.aeat_operation_qualification = t.aeat_operation_qualification,
               e.aeat_exemption_cause = t.aeat_exemption_cause
           WHERE e.reference_type = ? AND e.reference_id = ?`,
          ['SaleInvoice', invoiceId],
        );
      }
      const invoice = await this.records.loadInvoice(invoiceId, trx);
      return this.records.createRecord(invoice, 'subsanacion', trx, {
        rejectionPrevious: options.rejectionPrevious,
      });
    });
    await this.safeWake(recordId || undefined);
    return this.getRecord(recordId!);
  }

  async createAnulacion(
    invoiceId: number,
    options: CreateVerifactuAnulacionDto = {},
  ) {
    await this.ensureEffective();
    const recordId = await this.uow.withTransaction(async (trx) => {
      const locked = await trx('sales_invoices')
        .where({ id: invoiceId })
        .forUpdate()
        .first(['id', 'delivered_at']);
      if (!locked) throw new Error('SALE_INVOICE_NOT_FOUND');
      if (!locked.delivered_at) throw new Error('VERIFACTU_INVOICE_NOT_DELIVERED');
      const invoice = await this.records.loadInvoice(invoiceId, trx);
      return this.records.createRecord(invoice, 'anulacion', trx, {
        rejectionPrevious: options.rejectionPrevious,
      });
    });
    await this.safeWake(recordId || undefined);
    return this.getRecord(recordId!);
  }

  async dispatchPending() {
    await this.ensureEffective();
    return { processed: await this.dispatcher.processPending(50) };
  }

  async reconcileInvoice(invoiceId: number) {
    await this.ensureEffective();
    const record = await this.tenantKnex()('verifactu_records')
      .where({ sale_invoice_id: invoiceId })
      .whereIn('event', ['alta', 'subsanacion'])
      .orderBy('id', 'desc')
      .first();
    if (!record) throw new Error('VERIFACTU_RECORD_NOT_FOUND');
    const payload = typeof record.payload_json === 'string'
      ? JSON.parse(record.payload_json)
      : record.payload_json;
    const result = await this.aeat.queryRecord({
      issuerName: payload.issuerName,
      issuerNif: record.issuer_nif,
      invoiceNo: record.invoice_no,
      invoiceDate: formatAeatDate(record.invoice_date),
    });
    await this.tenantKnex()('verifactu_records')
      .where({ id: record.id })
      .update({
        aeat_query_response_xml: result.responseXml,
        last_reconciled_at: this.tenantKnex().fn.now(),
        ...(result.found ? {
          aeat_status: result.status,
          aeat_error_code: result.errorCode || null,
          aeat_error_message: result.errorMessage || null,
          accepted_at: ['Correcto', 'AceptadoConErrores'].includes(result.status)
            ? this.tenantKnex().fn.now()
            : record.accepted_at,
        } : {}),
      });
    return { recordId: record.id, ...result };
  }

  async retryRecord(recordId: number) {
    await this.ensureEffective();
    const knex = this.tenantKnex();
    const row = await knex('verifactu_records as r')
      .leftJoin('verifactu_dispatch as d', 'd.record_id', 'r.id')
      .where('r.id', recordId)
      .first([
        'r.id', 'r.aeat_status', 'r.event', 'd.id as dispatch_id',
        'd.state as dispatch_state', 'd.total_attempts', 'd.manual_retry_count',
      ]);
    if (!row) throw new Error('VERIFACTU_RECORD_NOT_FOUND');
    if (!row.dispatch_id) throw new Error('VERIFACTU_DISPATCH_NOT_FOUND');
    if (['Correcto', 'AceptadoConErrores'].includes(row.aeat_status)) {
      throw new Error('VERIFACTU_ACCEPTED_RECORD_CANNOT_RETRY');
    }
    if (row.aeat_status === 'Incorrecto') {
      throw new Error(
        row.event === 'anulacion'
          ? 'VERIFACTU_REJECTED_CANCELLATION_REQUIRES_NEW_ANULACION'
          : 'VERIFACTU_REJECTED_RECORD_REQUIRES_SUBSANACION',
      );
    }
    if (row.dispatch_state === 'processing') {
      throw new Error('VERIFACTU_RECORD_IS_PROCESSING');
    }

    await knex.transaction(async (trx) => {
      await trx('verifactu_dispatch').where({ id: row.dispatch_id }).update({
        state: 'retry', attempts: 0, locked_at: null, last_error: null,
        manual_retry_count: trx.raw('COALESCE(manual_retry_count, 0) + 1'),
        last_manual_retry_at: trx.fn.now(),
        next_attempt_at: trx.fn.now(), updated_at: trx.fn.now(),
      });
      await trx('verifactu_records').where({ id: recordId }).update({
        aeat_status: 'pending', aeat_error_code: null, aeat_error_message: null,
        updated_at: trx.fn.now(),
      });
    });
    await this.safeWake(recordId);
    return this.getRecord(recordId);
  }

  async getStats() {
    const knex = this.tenantKnex();
    const totalRow = await knex('verifactu_records').count<{ count: number }[]>({ count: '*' }).first();
    const statusRows = await knex('verifactu_records')
      .select('aeat_status')
      .count<{ aeat_status: string; count: number }[]>({ count: '*' })
      .groupBy('aeat_status');
    const dispatchRows = await knex('verifactu_dispatch')
      .select('state')
      .count<{ state: string; count: number }[]>({ count: '*' })
      .groupBy('state');
    const statuses = Object.fromEntries(
      statusRows.map((row: any) => [row.aeat_status || 'unknown', Number(row.count)]),
    );
    const dispatch = Object.fromEntries(
      dispatchRows.map((row: any) => [row.state || 'unknown', Number(row.count)]),
    );
    return {
      total: Number((totalRow as any)?.count || 0),
      statuses,
      dispatch,
      accepted: Number(statuses.Correcto || 0) + Number(statuses.AceptadoConErrores || 0),
      rejected: Number(statuses.Incorrecto || 0),
      technicalFailures: Number(statuses.transport_failed || 0),
      pending: Number(statuses.pending || 0),
    };
  }

  async getConsole(input: Record<string, string>) {
    const rawPage = Number(input.page || 1);
    const rawPageSize = Number(input.pageSize || 25);
    const page = Number.isFinite(rawPage) ? Math.max(Math.floor(rawPage), 1) : 1;
    const pageSize = Number.isFinite(rawPageSize)
      ? Math.min(Math.max(Math.floor(rawPageSize), 1), 100)
      : 25;
    const knex = this.tenantKnex();
    const base = knex('verifactu_records as r')
      .leftJoin('verifactu_dispatch as d', 'd.record_id', 'r.id')
      .leftJoin('sales_invoices as i', 'i.id', 'r.sale_invoice_id');

    this.applyConsoleFilters(base, input);
    const countQuery = base.clone().clearSelect().clearOrder().countDistinct({ count: 'r.id' }).first();
    const rowsQuery = base.clone()
      .select([
        'r.id', 'r.sale_invoice_id', 'r.event', 'r.record_version', 'r.invoice_type',
        'r.issuer_nif', 'r.invoice_no', 'r.invoice_date', 'r.tax_total', 'r.invoice_total',
        'r.previous_hash', 'r.hash', 'r.qr_url', 'r.aeat_status', 'r.aeat_csv',
        'r.aeat_error_code', 'r.aeat_error_message', 'r.sent_at', 'r.accepted_at',
        'r.last_reconciled_at', 'r.created_at', 'r.updated_at',
        'd.state as dispatch_state', 'd.attempts as dispatch_attempts',
        'd.total_attempts', 'd.manual_retry_count', 'd.last_manual_retry_at',
        'd.next_attempt_at', 'd.last_error as dispatch_error',
        'i.customer_id',
      ])
      .orderBy('r.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [countRow, rows] = await Promise.all([countQuery, rowsQuery]);
    return {
      data: rows,
      pagination: {
        page,
        pageSize,
        total: Number((countRow as any)?.count || 0),
      },
    };
  }

  async getRecords(invoiceId?: number) {
    const query = this.tenantKnex()('verifactu_records as r')
      .leftJoin('verifactu_dispatch as d', 'd.record_id', 'r.id')
      .select([
        'r.id', 'r.sale_invoice_id', 'r.event', 'r.record_version', 'r.issuer_nif',
        'r.invoice_no', 'r.invoice_date', 'r.invoice_type', 'r.generation_timestamp',
        'r.tax_total', 'r.invoice_total', 'r.previous_record_id', 'r.previous_hash',
        'r.hash', 'r.qr_url', 'r.aeat_status', 'r.aeat_csv', 'r.aeat_error_code',
        'r.aeat_error_message', 'r.sent_at', 'r.accepted_at', 'r.last_reconciled_at',
        'r.created_at', 'r.updated_at', 'd.state as dispatch_state',
        'd.attempts as dispatch_attempts', 'd.total_attempts',
        'd.manual_retry_count', 'd.last_manual_retry_at', 'd.next_attempt_at',
        'd.last_error as dispatch_error',
      ])
      .orderBy('r.id', 'desc');
    if (invoiceId) query.where('r.sale_invoice_id', invoiceId);
    return query;
  }

  async getRecord(id: number) {
    const row = await this.tenantKnex()('verifactu_records as r')
      .leftJoin('verifactu_dispatch as d', 'd.record_id', 'r.id')
      .where('r.id', id)
      .first([
        'r.*', 'd.state as dispatch_state', 'd.attempts as dispatch_attempts',
        'd.total_attempts', 'd.manual_retry_count', 'd.last_manual_retry_at',
        'd.next_attempt_at', 'd.last_error as dispatch_error',
        'd.tiempo_espera_envio',
      ]);
    if (!row) throw new Error('VERIFACTU_RECORD_NOT_FOUND');
    return row;
  }

  private applyConsoleFilters(query: Knex.QueryBuilder, input: Record<string, string>) {
    if (input.status) query.where('r.aeat_status', input.status);
    if (input.dispatchState) query.where('d.state', input.dispatchState);
    if (input.event) query.where('r.event', input.event);
    if (input.fromDate) query.where('r.invoice_date', '>=', input.fromDate);
    if (input.toDate) query.where('r.invoice_date', '<=', input.toDate);
    if (input.search) {
      const search = `%${input.search}%`;
      query.where((builder) => {
        builder
          .where('r.invoice_no', 'like', search)
          .orWhere('r.issuer_nif', 'like', search)
          .orWhere('r.aeat_csv', 'like', search)
          .orWhere('r.aeat_error_message', 'like', search);
      });
    }
  }

  private async ensureEffective() {
    const runtime = await this.settings.getRuntimeConfig();
    if (!runtime.serverEnabled) throw new Error('VERIFACTU_SERVER_DISABLED');
    if (runtime.siiEnabled) throw new Error('VERIFACTU_BLOCKED_BY_SII');
    if (!runtime.tenantEnabled) throw new Error('VERIFACTU_TENANT_DISABLED');
    return runtime;
  }

  private async safeWake(recordId?: number) {
    try {
      await this.eventsEmitter.emitAsync(events.verifactu.outboxReady, { recordId });
    } catch (error) {
      console.error('VERI*FACTU wake after commit failed:', error);
    }
  }
}
