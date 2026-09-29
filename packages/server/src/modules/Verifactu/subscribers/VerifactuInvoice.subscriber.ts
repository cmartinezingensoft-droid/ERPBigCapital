import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleInvoiceDeletePayload,
  ISaleInvoiceEditingPayload,
  ISaleInvoiceEventDeliveredPayload,
} from '@/modules/SaleInvoices/SaleInvoice.types';
import { VerifactuRecordService } from '../VerifactuRecord.service';
import { VerifactuQueueService } from '../VerifactuQueue.service';

@Injectable()
export class VerifactuInvoiceSubscriber {
  constructor(
    private readonly records: VerifactuRecordService,
    private readonly queue: VerifactuQueueService,
  ) {}

  @OnEvent(events.saleInvoice.onDelivered)
  async createAlta({ saleInvoice, trx }: ISaleInvoiceEventDeliveredPayload) {
    await this.records.createRecord(saleInvoice, 'alta', trx);
  }

  @OnEvent(events.saleInvoice.onEditing)
  async protectIssuedInvoice({ oldSaleInvoice, trx }: ISaleInvoiceEditingPayload) {
    const row = await trx('verifactu_records')
      .where({ sale_invoice_id: oldSaleInvoice.id }).first('id');
    // Once a fiscal record exists it stays immutable even if the tenant later
    // disables automatic submission or moves to SII.
    if (row) throw new Error('VERIFACTU_ISSUED_INVOICE_IMMUTABLE');
  }

  @OnEvent(events.saleInvoice.onDelete)
  async protectIssuedInvoiceDelete({ saleInvoiceId, trx }: ISaleInvoiceDeletePayload) {
    const row = await trx('verifactu_records').where({ sale_invoice_id: saleInvoiceId }).first('id');
    if (row) throw new Error('VERIFACTU_ISSUED_INVOICE_CANNOT_BE_DELETED');
  }

  @OnEvent(events.verifactu.outboxReady)
  async wakeDispatcher(payload?: { recordId?: number }) {
    try {
      await this.queue.enqueuePending(payload?.recordId);
    } catch (error) {
      console.error('VERI*FACTU queue wake-up failed; DB outbox remains pending:', error);
    }
  }
}
