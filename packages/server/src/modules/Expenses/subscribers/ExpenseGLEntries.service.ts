import { Knex } from 'knex';
import { ExpenseGL } from './ExpenseGL';
import { Inject, Injectable } from '@nestjs/common';
import { Expense } from '../models/Expense.model';
import { ILedger } from '@/modules/Ledger/types/Ledger.types';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { AccountRepository } from '@/modules/Accounts/repositories/Account.repository';

@Injectable()
export class ExpenseGLEntriesService {
  /**
   * @param {TenantModelProxy<typeof Expense>} expense - Expense model.
   */
  constructor(
    @Inject(Expense.name)
    private readonly expense: TenantModelProxy<typeof Expense>,
    private readonly accountRepository: AccountRepository,
  ) {}

  /**
   * Retrieves the expense G/L of the given id.
   * @param {number} expenseId
   * @param {Knex.Transaction} trx - Knex transaction.
   * @returns {Promise<ILedger>}
   */
  public getExpenseLedgerById = async (
    expenseId: number,
    trx?: Knex.Transaction,
  ): Promise<ILedger> => {
    const expense = await this.expense()
      .query(trx)
      .findById(expenseId)
      .withGraphFetched('categories')
      .withGraphFetched('paymentAccount')
      .throwIfNotFound();

    const inputVat = await this.accountRepository.findOrCreateSpanishInputVat(trx);
    const retentionPayable =
      await this.accountRepository.findOrCreateSpanishRetentionPayable(trx);

    return this.getExpenseLedger(expense, inputVat.id, retentionPayable.id);
  };

  /**
   * Retrieves the given expense ledger.
   * @param {Expense} expense - Expense model.
   * @returns {ILedger}
   */
  public getExpenseLedger = (
    expense: Expense,
    inputVatAccountId?: number,
    retentionPayableAccountId?: number,
  ): ILedger => {
    const expenseGL = new ExpenseGL(expense);
    if (inputVatAccountId) expenseGL.setInputVatAccountId(inputVatAccountId);
    if (retentionPayableAccountId)
      expenseGL.setRetentionPayableAccountId(retentionPayableAccountId);
    return expenseGL.getExpenseLedger();
  };
}
