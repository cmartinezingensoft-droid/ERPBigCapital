import * as moment from 'moment';
import '../../../utils/moment-mysql';
import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleInvoice } from '../models/SaleInvoice';
import { SaleInvoicePaymentEffect } from '../models/SaleInvoicePaymentEffect';
import { Customer } from '@/modules/Customers/models/Customer';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

const DEFAULT_PAYMENT_METHOD = 'receipt';

const parsePaymentTermsDays = (value?: string | null): number[] => {
  const days = String(value || '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isFinite(day) && day >= 0)
    .map((day) => Math.round(day));

  return days.length ? [...new Set(days)].sort((a, b) => a - b) : [];
};

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

@Injectable()
export class SaleInvoicePaymentEffects {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(SaleInvoicePaymentEffect.name)
    private readonly effectModel: TenantModelProxy<typeof SaleInvoicePaymentEffect>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  async rewriteInvoicePaymentEffects(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ) {
    const saleInvoice = await this.saleInvoiceModel()
      .query(trx)
      .findById(saleInvoiceId)
      .withGraphFetched('customer')
      .throwIfNotFound();

    const customerDefaults = saleInvoice.customer
      ? saleInvoice.customer
      : await this.customerModel().query(trx).findById(saleInvoice.customerId);

    await this.effectModel().query(trx).delete().where({ saleInvoiceId });

    const paymentMethod =
      saleInvoice.paymentMethod ||
      customerDefaults?.paymentMethod ||
      DEFAULT_PAYMENT_METHOD;

    const termDays =
      parsePaymentTermsDays(saleInvoice.paymentTermsDays).length > 0
        ? parsePaymentTermsDays(saleInvoice.paymentTermsDays)
        : parsePaymentTermsDays(customerDefaults?.paymentTermsDays);

    const effectiveTermDays = termDays.length
      ? termDays
      : [
          Math.max(
            moment(saleInvoice.dueDate).diff(moment(saleInvoice.invoiceDate), 'days'),
            0,
          ),
        ];

    const total = round2(saleInvoice.total);
    const baseAmount = round2(total / effectiveTermDays.length);
    let assigned = 0;

    const effects = effectiveTermDays.map((days, index) => {
      const amount =
        index === effectiveTermDays.length - 1
          ? round2(total - assigned)
          : baseAmount;
      assigned = round2(assigned + amount);

      return {
        saleInvoiceId,
        customerId: saleInvoice.customerId,
        paymentMethod,
        installmentIndex: index + 1,
        dueDate: moment(saleInvoice.invoiceDate).add(days, 'days').format('YYYY-MM-DD'),
        amount,
        status: 'pending' as const,
        createdAt: moment().toMySqlDateTime(),
      };
    });

    if (effects.length) {
      await this.effectModel().query(trx).insert(effects as any);
    }

    return effects;
  }

  async deleteInvoicePaymentEffects(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ) {
    await this.effectModel().query(trx).delete().where({ saleInvoiceId });
  }
}
