import { sumBy } from 'lodash';
import * as moment from 'moment';
import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { Bill } from '../models/Bill';
import { AccountNormal } from '@/modules/Accounts/Accounts.types';
import { Ledger } from '@/modules/Ledger/Ledger';
import { BillLandedCost } from '@/modules/BillLandedCosts/models/BillLandedCost';

/** Spanish purchase ledger: PGC 472 input VAT and PGC 4751 withholdings. */
export class BillGL {
  private bill: Bill;
  private payableAccountId: number;
  private inputVatAccountId: number;
  private retentionPayableAccountId: number;
  private purchaseDiscountAccountId: number;
  private otherExpensesAccountId: number;

  constructor(bill: Bill) { this.bill = bill; }
  setPayableAccountId(id: number) { this.payableAccountId = id; return this; }
  setTaxPayableAccountId(id: number) { return this.setInputVatAccountId(id); }
  setInputVatAccountId(id: number) { this.inputVatAccountId = id; return this; }
  setRetentionPayableAccountId(id: number) { this.retentionPayableAccountId = id; return this; }
  setPurchaseDiscountAccountId(id: number) { this.purchaseDiscountAccountId = id; return this; }
  setOtherExpensesAccountId(id: number) { this.otherExpensesAccountId = id; return this; }

  private get billCommonEntry() {
    return {
      debit: 0, credit: 0,
      currencyCode: this.bill.currencyCode,
      exchangeRate: this.bill.exchangeRate || 1,
      transactionId: this.bill.id,
      transactionType: 'Bill',
      date: moment(this.bill.billDate).format('YYYY-MM-DD'),
      userId: this.bill.userId,
      referenceNumber: this.bill.referenceNo,
      transactionNumber: this.bill.billNumber,
      branchId: this.bill.branchId,
      projectId: this.bill.projectId,
      createdAt: this.bill.createdAt,
    };
  }

  private local(amount: number) { return Number(amount || 0) * Number(this.bill.exchangeRate || 1); }

  private fiscalLine(entry: ItemEntry) {
    return calculateSpanishFiscalLine({
      quantity: Number(entry.quantity || 0), rate: Number(entry.rate || 0),
      lineDiscountType: entry.discountType, lineDiscount: Number(entry.discount || 0),
      vatRate: Number(entry.taxRate || 0),
      isInclusiveTax: Boolean(entry.isInclusiveTax ?? this.bill.isInclusiveTax),
      fiscalRegime: entry.fiscalRegime || 'standard',
      equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
      retentionRate: Number(entry.retentionRate || 0),
      documentDiscountAllocation: Number(entry.documentDiscountAllocation || 0),
      documentAdjustmentAllocation: Number(entry.documentAdjustmentAllocation || 0),
    });
  }

  private accountFor(entry: ItemEntry) {
    return entry.item.type === 'inventory'
      ? entry.item.inventoryAccountId
      : entry.costAccountId;
  }

  private getBillItemEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    const baseBeforeDocument = fiscal.taxableBase + fiscal.discountTaxBaseAmount - fiscal.adjustmentTaxBaseAmount;
    const landedCostAmount = sumBy(entry.allocatedCostEntries || [], 'cost');
    return {
      ...this.billCommonEntry,
      debit: this.local(baseBeforeDocument) + landedCostAmount,
      accountId: this.accountFor(entry),
      index: index + 1, indexGroup: 10, itemId: entry.itemId,
      accountNormal: AccountNormal.DEBIT,
      taxRateId: entry.taxRateId, taxRate: entry.taxRate,
    };
  }

  /** Equivalence surcharge paid on purchases is non-deductible and capitalised/expensed. */
  private getSurchargeEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    return {
      ...this.billCommonEntry,
      debit: this.local(fiscal.equivalenceSurchargeAmount),
      accountId: this.accountFor(entry),
      note: 'Recargo de equivalencia soportado no deducible',
      index: index + 1, indexGroup: 25,
      accountNormal: AccountNormal.DEBIT,
      taxRateId: entry.taxRateId, taxRate: entry.taxRate,
    };
  }

  private getBillLandedCostEntry(landedCost: BillLandedCost, index: number): ILedgerEntry {
    return { ...this.billCommonEntry, credit: landedCost.amount, accountId: landedCost.costAccountId,
      accountNormal: AccountNormal.DEBIT, index: index + 1, indexGroup: 20 };
  }

  private get billPayableEntry(): ILedgerEntry {
    return { ...this.billCommonEntry, credit: this.bill.totalLocal, accountId: this.payableAccountId,
      contactId: this.bill.vendorId, accountNormal: AccountNormal.CREDIT, index: 1, indexGroup: 5 };
  }

  private getInputVatEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    return { ...this.billCommonEntry, debit: this.local(fiscal.vatAmount), index: index + 1,
      indexGroup: 30, accountId: this.inputVatAccountId, accountNormal: AccountNormal.DEBIT,
      note: 'IVA soportado deducible', taxRateId: entry.taxRateId, taxRate: entry.taxRate };
  }

  private getRetentionEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const fiscal = this.fiscalLine(entry);
    return { ...this.billCommonEntry, credit: this.local(fiscal.retentionAmount), index: index + 1,
      indexGroup: 31, accountId: this.retentionPayableAccountId, accountNormal: AccountNormal.CREDIT,
      note: 'Retención practicada a proveedor/profesional', taxRateId: entry.taxRateId, taxRate: entry.taxRate };
  }

  private get purchaseDiscountEntry(): ILedgerEntry {
    const discountBase = this.bill.entries.reduce((sum, e) => sum + this.fiscalLine(e).discountTaxBaseAmount, 0);
    return { ...this.billCommonEntry, credit: this.local(discountBase), accountId: this.purchaseDiscountAccountId,
      accountNormal: AccountNormal.DEBIT, index: 1, indexGroup: 40 };
  }

  private get adjustmentEntry(): ILedgerEntry {
    const adjustmentBase = this.bill.entries.reduce((sum, e) => sum + this.fiscalLine(e).adjustmentTaxBaseAmount, 0);
    const local = this.local(adjustmentBase); const amount = Math.abs(local);
    return { ...this.billCommonEntry, debit: local > 0 ? amount : 0, credit: local < 0 ? amount : 0,
      accountId: this.otherExpensesAccountId, accountNormal: AccountNormal.DEBIT, index: 1, indexGroup: 40 };
  }

  private getBillGLEntries = (): ILedgerEntry[] => {
    const entries = this.bill.entries || [];
    const items = entries.map((e, i) => this.getBillItemEntry(e, i));
    const landed = (this.bill.locatedLandedCosts || []).map((e, i) => this.getBillLandedCostEntry(e, i));
    const vat = entries.filter((e) => this.fiscalLine(e).vatAmount > 0).map((e, i) => this.getInputVatEntry(e, i));
    const surcharge = entries.filter((e) => this.fiscalLine(e).equivalenceSurchargeAmount > 0).map((e, i) => this.getSurchargeEntry(e, i));
    const retentions = entries.filter((e) => this.fiscalLine(e).retentionAmount > 0).map((e, i) => this.getRetentionEntry(e, i));
    return [this.billPayableEntry, ...items, ...landed, ...vat, ...surcharge, ...retentions,
      this.purchaseDiscountEntry, this.adjustmentEntry];
  };

  public getBillLedger = () => new Ledger(this.getBillGLEntries());
}
