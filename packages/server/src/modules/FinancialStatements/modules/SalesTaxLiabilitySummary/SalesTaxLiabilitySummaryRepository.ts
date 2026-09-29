import { ACCOUNT_TYPE } from '@/constants/accounts';
import {
  SalesTaxLiabilitySummaryPayableById,
  SalesTaxLiabilitySummarySalesById,
} from './SalesTaxLiability.types';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { keyBy } from 'lodash';
import { TaxRateModel } from '@/modules/TaxRates/models/TaxRate.model';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { Account } from '@/modules/Accounts/models/Account.model';
import { ModelObject } from 'objection';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SalesTaxLiabilitySummaryQuery } from './SalesTaxLiability.types';

@Injectable({ scope: Scope.TRANSIENT })
export class SalesTaxLiabilitySummaryRepository {
  @Inject(TaxRateModel.name)
  private readonly taxRateModel: TenantModelProxy<typeof TaxRateModel>;

  @Inject(AccountTransaction.name)
  private readonly accountTransactionModel: TenantModelProxy<
    typeof AccountTransaction
  >;

  @Inject(Account.name)
  private readonly accountModel: TenantModelProxy<typeof Account>;

  /**
   * @param {SalesTaxLiabilitySummarySalesById}
   */
  accountTransactionsByTaxRateId: SalesTaxLiabilitySummarySalesById;

  /**
   * @param {SalesTaxLiabilitySummaryPayableById}
   */
  taxesPayableByTaxRateId: SalesTaxLiabilitySummaryPayableById;

  /**
   * @param {Array<ModelObject<TaxRateModel>>}
   */
  taxRates: Array<ModelObject<TaxRateModel>>;

  /**
   * Load data.
   */
  private query?: SalesTaxLiabilitySummaryQuery;

  async load(query?: SalesTaxLiabilitySummaryQuery) {
    this.query = query;
    await this.initTaxRates();
    await this.initTaxesPayableByTaxRateId();
    await this.initAccountTransactionsByTaxRateId();
  }

  private applyPeriod(builder: any) {
    if (this.query?.fromDate) builder.where('date', '>=', this.query.fromDate);
    if (this.query?.toDate) builder.where('date', '<=', this.query.toDate);
    return builder;
  }

  /**
   * Initialize tax rates.
   */
  async initTaxRates() {
    const taxRates = await this.getTaxRates();
    this.taxRates = taxRates;
  }

  /**
   * Initialize account transactions by tax rate id.
   */
  async initAccountTransactionsByTaxRateId() {
    const transactionsByTaxRateId = await this.taxesSalesSumGroupedByRateId();

    this.accountTransactionsByTaxRateId = transactionsByTaxRateId;
  }

  /**
   * Initialize taxes payable by tax rate id.
   */
  async initTaxesPayableByTaxRateId() {
    const payableTaxes = await this.getTaxesPayableSumGroupedByRateId();

    this.taxesPayableByTaxRateId = payableTaxes;
  }

  /**
   * Retrieve tax rates.
   * @param {number} tenantId
   * @returns {Promise<TaxRate[]>}
   */
  public getTaxRates = () => {
    return this.taxRateModel().query().orderBy('name', 'desc');
  };

  /**
   * Retrieve taxes payable sum grouped by tax rate id.
   * @returns {Promise<SalesTaxLiabilitySummaryPayableById>}
   */
  public async getTaxesPayableSumGroupedByRateId(): Promise<SalesTaxLiabilitySummaryPayableById> {
    // Retrieves tax payable accounts.
    const taxPayableAccounts = await this.accountModel()
      .query()
      .whereIn('accountType', [ACCOUNT_TYPE.TAX_PAYABLE]);

    const payableAccountsIds = taxPayableAccounts.map((account) => account.id);

    const payableQuery = this.accountTransactionModel()
      .query()
      .whereIn('account_id', payableAccountsIds)
      .whereNot('tax_rate_id', null);
    this.applyPeriod(payableQuery);
    const groupedTaxesById = await payableQuery
      .groupBy('tax_rate_id')
      .select(['tax_rate_id'])
      .sum('credit as credit')
      .sum('debit as debit');

    return keyBy(groupedTaxesById, 'taxRateId');
  }

  /**
   * Retrieve taxes sales sum grouped by tax rate id.
   * @returns {Promise<SalesTaxLiabilitySummarySalesById>}
   */
  public taxesSalesSumGroupedByRateId =
    async (): Promise<SalesTaxLiabilitySummarySalesById> => {
      const incomeAccounts = await this.accountModel()
        .query()
        .whereIn('accountType', [
          ACCOUNT_TYPE.INCOME,
          ACCOUNT_TYPE.OTHER_INCOME,
        ]);
      const incomeAccountsIds = incomeAccounts.map((account) => account.id);

      const salesQuery = this.accountTransactionModel()
        .query()
        .whereIn('account_id', incomeAccountsIds)
        .whereNot('tax_rate_id', null);
      this.applyPeriod(salesQuery);
      const groupedTaxesById = await salesQuery
        .groupBy('tax_rate_id')
        .select(['tax_rate_id'])
        .sum('credit as credit')
        .sum('debit as debit');

      return keyBy(groupedTaxesById, 'taxRateId');
    };
}
