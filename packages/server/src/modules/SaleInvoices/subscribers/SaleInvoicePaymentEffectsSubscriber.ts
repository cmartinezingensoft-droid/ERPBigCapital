import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleInvoiceCreatedPayload,
  ISaleInvoiceDeletePayload,
  ISaleInvoiceEditedPayload,
} from '../SaleInvoice.types';
import { SaleInvoicePaymentEffects } from '../commands/SaleInvoicePaymentEffects.service';

@Injectable()
export class SaleInvoicePaymentEffectsSubscriber {
  constructor(
    private readonly saleInvoicePaymentEffects: SaleInvoicePaymentEffects,
  ) {}

  @OnEvent(events.saleInvoice.onCreated)
  @OnEvent(events.saleInvoice.onDelivered)
  async handleInvoiceCreatedOrDelivered({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceCreatedPayload) {
    await this.saleInvoicePaymentEffects.rewriteInvoicePaymentEffects(
      saleInvoiceId,
      trx,
    );
  }

  @OnEvent(events.saleInvoice.onEdited)
  async handleInvoiceEdited({ saleInvoiceId, saleInvoice, trx }: ISaleInvoiceEditedPayload) {
    await this.saleInvoicePaymentEffects.rewriteInvoicePaymentEffects(
      saleInvoiceId || saleInvoice.id,
      trx,
    );
  }

  @OnEvent(events.saleInvoice.onDeleted)
  async handleInvoiceDeleted({ saleInvoiceId, trx }: ISaleInvoiceDeletePayload) {
    await this.saleInvoicePaymentEffects.deleteInvoicePaymentEffects(
      saleInvoiceId,
      trx,
    );
  }
}
