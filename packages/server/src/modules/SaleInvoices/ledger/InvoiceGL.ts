import * as R from 'ramda';
import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { ILedger } from '@/modules/Ledger/types/Ledger.types';
import { AccountNormal } from '@/modules/Accounts/Accounts.types';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { Ledger } from '@/modules/Ledger/Ledger';
import { SaleInvoice } from '../models/SaleInvoice';

/**
 * Sale-invoice ledger built from the same Spanish fiscal snapshot used by the
 * invoice totals and VERI*FACTU. This prevents line/document discounts from
 * producing a VAT amount different from the amount posted to the ledger.
 */
export class InvoiceGL {
  private saleInvoice: SaleInvoice;
  private ARAccountId: number;
  private taxPayableAccountId: number;
  private retentionReceivableAccountId: number;
  private discountAccountId: number;
  private otherChargesAccountId: number;

  constructor(saleInvoice: SaleInvoice) {
    this.saleInvoice = saleInvoice;
  }

  setARAccountId(ARAccountId: number) {
    this.ARAccountId = ARAccountId;
  }

  setTaxPayableAccountId(taxPayableAccountId: number) {
    this.taxPayableAccountId = taxPayableAccountId;
  }

  setRetentionReceivableAccountId(accountId: number) {
    this.retentionReceivableAccountId = accountId;
  }

  setDiscountAccountId(discountAccountId: number) {
    this.discountAccountId = discountAccountId;
  }

  setOtherChargesAccountId(otherChargesAccountId: number) {
    this.otherChargesAccountId = otherChargesAccountId;
  }

  private get invoiceGLCommonEntry() {
    return {
      credit: 0,
      debit: 0,
      currencyCode: this.saleInvoice.currencyCode,
      exchangeRate: this.saleInvoice.exchangeRate,
      transactionType: 'SaleInvoice',
      transactionId: this.saleInvoice.id,
      date: this.saleInvoice.invoiceDate,
      userId: this.saleInvoice.userId,
      transactionNumber: this.saleInvoice.invoiceNo,
      referenceNumber: this.saleInvoice.referenceNo,
      createdAt: this.saleInvoice.createdAt,
      indexGroup: 10,
      branchId: this.saleInvoice.branchId,
    };
  }

  private fiscalLine(entry: ItemEntry) {
    return calculateSpanishFiscalLine({
      quantity: Number(entry.quantity || 0),
      rate: Number(entry.rate || 0),
      lineDiscountType: entry.discountType,
      lineDiscount: Number(entry.discount || 0),
      vatRate: Number(entry.taxRate || 0),
      isInclusiveTax: Boolean(entry.isInclusiveTax ?? this.saleInvoice.isInclusiveTax),
      fiscalRegime: entry.fiscalRegime || 'standard',
      equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
      retentionRate: Number(entry.retentionRate || 0),
      documentDiscountAllocation: Number(entry.documentDiscountAllocation || 0),
      documentAdjustmentAllocation: Number(entry.documentAdjustmentAllocation || 0),
    });
  }

  private local(amount: number) {
    return Number(amount || 0) * Number(this.saleInvoice.exchangeRate || 1);
  }

  public get invoiceReceivableEntry(): ILedgerEntry {
    return {
      ...this.invoiceGLCommonEntry,
      debit: this.saleInvoice.totalLocal,
      accountId: this.ARAccountId,
      contactId: this.saleInvoice.customerId,
      accountNormal: AccountNormal.DEBIT,
      index: 1,
    };
  }

  /** Revenue after line discount, before document discount/adjustment. */
  private getInvoiceItemEntry = R.curry(
    (entry: ItemEntry, index: number): ILedgerEntry => {
      const fiscal = this.fiscalLine(entry);
      const revenueBase =
        fiscal.taxableBase +
        fiscal.discountTaxBaseAmount -
        fiscal.adjustmentTaxBaseAmount;

      return {
        ...this.invoiceGLCommonEntry,
        credit: this.local(revenueBase),
        accountId: entry.sellAccountId,
        note: entry.description,
        index: index + 2,
        itemId: entry.itemId,
        accountNormal: AccountNormal.CREDIT,
        taxRateId: entry.taxRateId,
        taxRate: entry.taxRate,
      };
    },
  );

  /** VAT plus equivalence surcharge are both liabilities to AEAT. */
  private getInvoiceTaxEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    return {
      ...this.invoiceGLCommonEntry,
      credit: this.local(fiscal.vatAmount + fiscal.equivalenceSurchargeAmount),
      accountId: this.taxPayableAccountId,
      note: fiscal.equivalenceSurchargeAmount
        ? 'IVA repercutido + recargo de equivalencia'
        : 'IVA repercutido',
      index: index + 1,
      indexGroup: 30,
      accountNormal: AccountNormal.CREDIT,
      taxRateId: entry.taxRateId,
      taxRate: entry.taxRate,
    };
  }

  /** IRPF withheld by the customer is a tax receivable (PGC 473), not expense. */
  private getInvoiceRetentionEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    return {
      ...this.invoiceGLCommonEntry,
      debit: this.local(fiscal.retentionAmount),
      accountId: this.retentionReceivableAccountId,
      note: 'Retención IRPF soportada',
      index: index + 1,
      indexGroup: 31,
      accountNormal: AccountNormal.DEBIT,
      taxRateId: entry.taxRateId,
      taxRate: entry.taxRate,
    };
  }

  private get invoiceDiscountEntry(): ILedgerEntry {
    const discountBase = this.saleInvoice.entries.reduce(
      (sum, entry) => sum + this.fiscalLine(entry).discountTaxBaseAmount,
      0,
    );
    return {
      ...this.invoiceGLCommonEntry,
      debit: this.local(discountBase),
      accountId: this.discountAccountId,
      accountNormal: AccountNormal.CREDIT,
      index: 1,
    } as ILedgerEntry;
  }

  private get adjustmentEntry(): ILedgerEntry {
    const adjustmentBase = this.saleInvoice.entries.reduce(
      (sum, entry) => sum + this.fiscalLine(entry).adjustmentTaxBaseAmount,
      0,
    );
    const localAdjustment = this.local(adjustmentBase);
    const adjustmentAmount = Math.abs(localAdjustment);
    return {
      ...this.invoiceGLCommonEntry,
      debit: localAdjustment < 0 ? adjustmentAmount : 0,
      credit: localAdjustment > 0 ? adjustmentAmount : 0,
      accountId: this.otherChargesAccountId,
      accountNormal: AccountNormal.CREDIT,
      index: 1,
    };
  }

  public getInvoiceGLEntries = (): ILedgerEntry[] => {
    const creditEntries = this.saleInvoice.entries.map((entry, index) =>
      this.getInvoiceItemEntry(entry, index),
    );
    const taxEntries = this.saleInvoice.entries
      .filter((entry) => {
        const fiscal = this.fiscalLine(entry);
        return fiscal.vatAmount > 0 || fiscal.equivalenceSurchargeAmount > 0;
      })
      .map((entry, index) => this.getInvoiceTaxEntry(entry, index));
    const retentionEntries = this.saleInvoice.entries
      .filter((entry) => this.fiscalLine(entry).retentionAmount > 0)
      .map((entry, index) => this.getInvoiceRetentionEntry(entry, index));

    return [
      this.invoiceReceivableEntry,
      ...creditEntries,
      ...taxEntries,
      ...retentionEntries,
      this.invoiceDiscountEntry,
      this.adjustmentEntry,
    ];
  };

  public getInvoiceLedger = (): ILedger => new Ledger(this.getInvoiceGLEntries());
}
