import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { VerifactuAeatClient } from './VerifactuAeatClient.service';
import { VerifactuSettingsService } from './VerifactuSettings.service';

@Injectable()
export class VerifactuDispatcher {
  constructor(
    private readonly client: VerifactuAeatClient,
    private readonly settings: VerifactuSettingsService,
    @Inject(TENANCY_DB_CONNECTION)
    private readonly tenantKnex: () => Knex,
  ) {}

  async processPending(limit = 25): Promise<number> {
    const runtime = await this.settings.getRuntimeConfig();
    if (!runtime.effectiveEnabled) return 0;
    let processed = 0;
    while (processed < limit) {
      const row = await this.claimNext();
      if (!row) break;
      await this.processClaimed(row, runtime.maxAttempts);
      processed += 1;
    }
    return processed;
  }

  private async claimNext(): Promise<any | null> {
    const knex = this.tenantKnex();
    return knex.transaction(async (trx) => {
      await trx('verifactu_dispatch')
        .where({ state: 'processing' })
        .where('locked_at', '<', trx.raw('DATE_SUB(NOW(), INTERVAL 5 MINUTE)'))
        .update({ state: 'retry', locked_at: null, next_attempt_at: trx.fn.now() });

      const row = await trx('verifactu_dispatch as d')
        .join('verifactu_records as r', 'r.id', 'd.record_id')
        .whereIn('d.state', ['pending', 'retry'])
        .where((builder) =>
          builder.whereNull('d.next_attempt_at').orWhere('d.next_attempt_at', '<=', trx.fn.now()),
        )
        .orderBy('d.id', 'asc')
        .forUpdate()
        .first([
          'd.id as dispatch_id', 'd.record_id', 'd.attempts', 'r.payload_xml',
          'r.event', 'r.sale_invoice_id',
        ]);
      if (!row) return null;

      await trx('verifactu_dispatch').where({ id: row.dispatch_id }).update({
        state: 'processing',
        attempts: Number(row.attempts || 0) + 1,
        total_attempts: trx.raw('COALESCE(total_attempts, 0) + 1'),
        locked_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
      row.attempts = Number(row.attempts || 0) + 1;
      return row;
    });
  }

  private async processClaimed(row: any, maxAttempts: number): Promise<void> {
    const knex = this.tenantKnex();
    try {
      const result = await this.client.submit(row.payload_xml);
      const waitSeconds = Math.max(Number(result.waitSeconds || 0), 0);

      if (result.ok) {
        await knex.transaction(async (trx) => {
          await trx('verifactu_records').where({ id: row.record_id }).update({
            aeat_status: result.status,
            aeat_csv: result.csv || null,
            aeat_error_code: result.errorCode || null,
            aeat_error_message: result.errorMessage || null,
            last_response_xml: result.responseXml,
            sent_at: trx.fn.now(), accepted_at: trx.fn.now(), updated_at: trx.fn.now(),
          });
          await trx('verifactu_dispatch').where({ id: row.dispatch_id }).update({
            state: 'completed', locked_at: null, tiempo_espera_envio: waitSeconds,
            last_error: null, updated_at: trx.fn.now(),
          });
        });
        return;
      }

      const clientFault = result.soapFault && /client/i.test(result.errorCode || '');
      // An AEAT registry rejection is fiscal, not a transport problem: it must
      // be corrected using a new immutable subsanación/cancellation record.
      const permanent = clientFault || result.status === 'Incorrecto';
      const state = permanent || row.attempts >= maxAttempts ? 'failed' : 'retry';
      const delay = this.retryDelaySeconds(row.attempts, waitSeconds);
      await knex.transaction(async (trx) => {
        await trx('verifactu_records').where({ id: row.record_id }).update({
          aeat_status: result.status,
          aeat_csv: result.csv || null,
          aeat_error_code: result.errorCode || null,
          aeat_error_message: result.errorMessage || null,
          last_response_xml: result.responseXml,
          sent_at: trx.fn.now(), updated_at: trx.fn.now(),
        });
        await trx('verifactu_dispatch').where({ id: row.dispatch_id }).update({
          state, locked_at: null, tiempo_espera_envio: waitSeconds,
          last_error: [result.errorCode, result.errorMessage].filter(Boolean).join(': ') || result.status,
          next_attempt_at: state === 'retry'
            ? trx.raw('DATE_ADD(NOW(), INTERVAL ? SECOND)', [delay]) : null,
          updated_at: trx.fn.now(),
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const state = row.attempts >= maxAttempts ? 'failed' : 'retry';
      const delay = this.retryDelaySeconds(row.attempts, 0);
      await knex('verifactu_dispatch').where({ id: row.dispatch_id }).update({
        state, locked_at: null, last_error: message.slice(0, 2000),
        next_attempt_at: state === 'retry'
          ? knex.raw('DATE_ADD(NOW(), INTERVAL ? SECOND)', [delay]) : null,
        updated_at: knex.fn.now(),
      });
      if (state === 'failed') {
        await knex('verifactu_records').where({ id: row.record_id }).update({
          aeat_status: 'transport_failed', aeat_error_message: message.slice(0, 2000),
          updated_at: knex.fn.now(),
        });
      }
    }
  }

  private retryDelaySeconds(attempt: number, aeatWaitSeconds: number): number {
    const exponential = Math.min(3600, 15 * Math.pow(2, Math.max(0, attempt - 1)));
    return Math.max(exponential, aeatWaitSeconds || 0);
  }
}
