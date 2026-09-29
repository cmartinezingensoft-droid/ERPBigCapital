import * as R from 'ramda';
import { ILedger } from '@/modules/Ledger/types/Ledger.types';
import { AccountNormal } from '@/modules/Accounts/Accounts.types';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { ExpenseCategory } from '../models/ExpenseCategory.model';
import { Ledger } from '@/modules/Ledger/Ledger';
import { Expense } from '../models/Expense.model';

/** Spanish expense ledger with deductible input VAT and supplier withholdings. */
export class ExpenseGL {
  private expense: Expense;
  private inputVatAccountId?: number;
  private retentionPayableAccountId?: number;

  constructor(expense: Expense) { this.expense = expense; }
  setInputVatAccountId(id: number) { this.inputVatAccountId = id; return this; }
  setRetentionPayableAccountId(id: number) { this.retentionPayableAccountId = id; return this; }

  private getExpenseGLCommonEntry = () => ({
    currencyCode: this.expense.currencyCode,
    exchangeRate: this.expense.exchangeRate,
    transactionType: 'Expense',
    transactionId: this.expense.id,
    date: this.expense.paymentDate,
    userId: this.expense.userId,
    debit: 0,
    credit: 0,
    branchId: this.expense.branchId,
  });

  private local(amount: number) {
    return Number(amount || 0) * Number(this.expense.exchangeRate || 1);
  }

  private getExpenseGLPaymentEntry = (): ILedgerEntry => ({
    ...this.getExpenseGLCommonEntry(),
    credit: this.expense.localAmount,
    accountId: this.expense.paymentAccountId,
    accountNormal:
      this.expense?.paymentAccount?.accountNormal === 'debit'
        ? AccountNormal.DEBIT
        : AccountNormal.CREDIT,
    index: 1,
  });

  private getExpenseGLCategoryEntry = R.curry(
    (category: ExpenseCategory, index: number): ILedgerEntry => ({
      ...this.getExpenseGLCommonEntry(),
      accountId: category.expenseAccountId,
      accountNormal: AccountNormal.DEBIT,
      debit: this.local(Number(category.amount || 0) + Number(category.equivalenceSurchargeAmount || 0)),
      note: category.equivalenceSurchargeAmount
        ? `${category.description || ''} · incluye RE soportado no deducible`.trim()
        : category.description,
      index: index + 2,
      projectId: category.projectId,
      taxRateId: category.taxRateId,
      taxRate: category.taxRate,
    }),
  );

  private getVatEntry(category: ExpenseCategory, index: number): ILedgerEntry {
    return {
      ...this.getExpenseGLCommonEntry(),
      debit: this.local(category.taxAmount),
      accountId: this.inputVatAccountId,
      accountNormal: AccountNormal.DEBIT,
      note: 'IVA soportado deducible',
      index: index + 1,
      indexGroup: 30,
      taxRateId: category.taxRateId,
      taxRate: category.taxRate,
    };
  }

  private getRetentionEntry(category: ExpenseCategory, index: number): ILedgerEntry {
    return {
      ...this.getExpenseGLCommonEntry(),
      credit: this.local(category.retentionAmount),
      accountId: this.retentionPayableAccountId,
      accountNormal: AccountNormal.CREDIT,
      note: 'Retención practicada en gasto',
      index: index + 1,
      indexGroup: 31,
      taxRateId: category.taxRateId,
      taxRate: category.taxRate,
    };
  }

  public getExpenseGLEntries = (): ILedgerEntry[] => {
    const getCategoryEntry = this.getExpenseGLCategoryEntry();
    const categories = this.expense.categories || [];
    const categoryEntries = categories.map((category, index) =>
      getCategoryEntry(category, index),
    );
    const vatEntries = categories
      .filter((category) => Number(category.taxAmount || 0) > 0)
      .map((category, index) => this.getVatEntry(category, index));
    const retentionEntries = categories
      .filter((category) => Number(category.retentionAmount || 0) > 0)
      .map((category, index) => this.getRetentionEntry(category, index));

    return [this.getExpenseGLPaymentEntry(), ...categoryEntries, ...vatEntries, ...retentionEntries];
  };

  public getExpenseLedger = (): ILedger => new Ledger(this.getExpenseGLEntries());
}
