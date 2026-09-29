import { Knex } from 'knex';
import { Injectable } from '@nestjs/common';
import { AutoIncrementOrdersService } from '../../AutoIncrementOrders/AutoIncrementOrders.service';

@Injectable()
export class SaleInvoiceIncrement {
  constructor(
    private readonly autoIncrementOrdersService: AutoIncrementOrdersService,
  ) {}

  /**
   * Retrieves the next unique invoice number.
   * @param {number} tenantId - Tenant id.
   * @return {Promise<string>}
   */
  public getNextInvoiceNumber(): Promise<string> {
    return this.autoIncrementOrdersService.getNextTransactionNumber(
      'sales_invoices',
    );
  }

  /** Atomically reserve the next invoice number inside the caller transaction. */
  public reserveNextInvoiceNumber(trx: Knex.Transaction): Promise<string> {
    return this.autoIncrementOrdersService.reserveNextTransactionNumber(
      'sales_invoices',
      trx,
    );
  }

  /**
   * Increment the invoice next number.
   * @param {number} tenantId -
   */
  public incrementNextInvoiceNumber() {
    return this.autoIncrementOrdersService.incrementSettingsNextNumber(
      'sales_invoices',
    );
  }
}
