import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';

export class SaleInvoicePaymentEffect extends TenantBaseModel {
  saleInvoiceId: number;
  customerId: number;
  paymentMethod: string;
  installmentIndex: number;
  dueDate: Date | string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date | null;

  static get tableName() {
    return 'sale_invoice_payment_effects';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  static get relationMappings() {
    const { SaleInvoice } = require('./SaleInvoice');
    const { Customer } = require('../../Customers/models/Customer');

    return {
      saleInvoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: SaleInvoice,
        join: {
          from: 'sale_invoice_payment_effects.saleInvoiceId',
          to: 'sales_invoices.id',
        },
      },
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Customer,
        join: {
          from: 'sale_invoice_payment_effects.customerId',
          to: 'contacts.id',
        },
      },
    };
  }
}
