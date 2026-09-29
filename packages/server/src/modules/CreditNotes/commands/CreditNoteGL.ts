import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { CreditNote } from '../models/CreditNote';
import { AccountNormal } from '@/interfaces/Account';
import { Ledger } from '@/modules/Ledger/Ledger';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';

/** Spanish sales rectification ledger (inverse of SaleInvoice GL). */
export class CreditNoteGL {
  creditNoteModel: CreditNote;
  ARAccountId: number;
  discountAccountId: number;
  adjustmentAccountId: number;
  taxPayableAccountId: number;
  retentionReceivableAccountId: number;

  constructor(model: CreditNote) { this.creditNoteModel = model; }
  public setARAccountId(id: number) { this.ARAccountId = id; return this; }
  public setDiscountAccountId(id: number) { this.discountAccountId = id; return this; }
  public setAdjustmentAccountId(id: number) { this.adjustmentAccountId = id; return this; }
  public setTaxPayableAccountId(id: number) { this.taxPayableAccountId = id; return this; }
  public setRetentionReceivableAccountId(id: number) { this.retentionReceivableAccountId = id; return this; }

  private get common() {
    return { date: this.creditNoteModel.creditNoteDate, userId: this.creditNoteModel.userId,
      currencyCode: this.creditNoteModel.currencyCode, exchangeRate: this.creditNoteModel.exchangeRate,
      transactionType: 'CreditNote', transactionId: this.creditNoteModel.id,
      transactionNumber: this.creditNoteModel.creditNoteNumber, referenceNumber: this.creditNoteModel.referenceNo,
      createdAt: this.creditNoteModel.createdAt, indexGroup: 10, credit: 0, debit: 0,
      branchId: this.creditNoteModel.branchId };
  }
  private local(v: number) { return Number(v || 0) * Number(this.creditNoteModel.exchangeRate || 1); }
  private fiscalLine(entry: ItemEntry) {
    return calculateSpanishFiscalLine({ quantity: Number(entry.quantity || 0), rate: Number(entry.rate || 0),
      lineDiscountType: entry.discountType, lineDiscount: Number(entry.discount || 0), vatRate: Number(entry.taxRate || 0),
      isInclusiveTax: Boolean(entry.isInclusiveTax), fiscalRegime: entry.fiscalRegime || 'standard',
      equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0), retentionRate: Number(entry.retentionRate || 0),
      documentDiscountAllocation: Number(entry.documentDiscountAllocation || 0),
      documentAdjustmentAllocation: Number(entry.documentAdjustmentAllocation || 0) });
  }
  private get arEntry(): ILedgerEntry { return { ...this.common, credit: this.creditNoteModel.totalLocal,
    accountId: this.ARAccountId, contactId: this.creditNoteModel.customerId, index: 1, accountNormal: AccountNormal.DEBIT }; }
  private itemEntry(entry: ItemEntry, index: number): ILedgerEntry {
    const f=this.fiscalLine(entry); const base=f.taxableBase+f.discountTaxBaseAmount-f.adjustmentTaxBaseAmount;
    return { ...this.common, debit: this.local(base), accountId: entry.sellAccountId || entry.item.sellAccountId,
      note: entry.description, index: index+2, itemId: entry.itemId, accountNormal: AccountNormal.CREDIT,
      taxRateId: entry.taxRateId, taxRate: entry.taxRate };
  }
  private taxEntry(entry: ItemEntry, index:number): ILedgerEntry { const f=this.fiscalLine(entry); return {
    ...this.common, debit:this.local(f.vatAmount+f.equivalenceSurchargeAmount), accountId:this.taxPayableAccountId,
    note:f.equivalenceSurchargeAmount?'Rectificación IVA repercutido + RE':'Rectificación IVA repercutido',
    index:index+1,indexGroup:30,accountNormal:AccountNormal.CREDIT,taxRateId:entry.taxRateId,taxRate:entry.taxRate}; }
  private retentionEntry(entry:ItemEntry,index:number):ILedgerEntry { const f=this.fiscalLine(entry); return {
    ...this.common, credit:this.local(f.retentionAmount), accountId:this.retentionReceivableAccountId,
    note:'Rectificación retención IRPF soportada',index:index+1,indexGroup:31,accountNormal:AccountNormal.DEBIT,
    taxRateId:entry.taxRateId,taxRate:entry.taxRate}; }
  private get discountEntry(): ILedgerEntry { const base=(this.creditNoteModel.entries||[]).reduce((s,e)=>s+this.fiscalLine(e).discountTaxBaseAmount,0);
    return {...this.common,credit:this.local(base),accountId:this.discountAccountId,accountNormal:AccountNormal.CREDIT,index:1}; }
  private get adjustmentEntry(): ILedgerEntry { const base=(this.creditNoteModel.entries||[]).reduce((s,e)=>s+this.fiscalLine(e).adjustmentTaxBaseAmount,0);
    const local=this.local(base), amount=Math.abs(local); return {...this.common,credit:local<0?amount:0,debit:local>0?amount:0,
      accountId:this.adjustmentAccountId,accountNormal:AccountNormal.CREDIT,index:1}; }
  public getCreditNoteGLEntries(): ILedgerEntry[] { const entries=this.creditNoteModel.entries||[]; return [this.arEntry,
    ...entries.map((e,i)=>this.itemEntry(e,i)),
    ...entries.filter(e=>{const f=this.fiscalLine(e);return f.vatAmount>0||f.equivalenceSurchargeAmount>0}).map((e,i)=>this.taxEntry(e,i)),
    ...entries.filter(e=>this.fiscalLine(e).retentionAmount>0).map((e,i)=>this.retentionEntry(e,i)),
    this.discountEntry,this.adjustmentEntry]; }
  public getCreditNoteLedger(): Ledger { return new Ledger(this.getCreditNoteGLEntries()); }
}
