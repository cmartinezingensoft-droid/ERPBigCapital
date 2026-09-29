import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { AccountNormal } from '@/interfaces/Account';
import { Ledger } from '@/modules/Ledger/Ledger';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { VendorCredit } from '../models/VendorCredit';

/** Spanish purchase rectification ledger (inverse of Bill GL). */
export class VendorCreditGL {
  private vendorCredit: VendorCredit;
  private APAccountId:number; private purchaseDiscountAccountId:number; private otherExpensesAccountId:number;
  private inputVatAccountId:number; private retentionPayableAccountId:number;
  constructor(vc:VendorCredit){this.vendorCredit=vc;}
  setAPAccountId(id:number){this.APAccountId=id;return this;} setPurchaseDiscountAccountId(id:number){this.purchaseDiscountAccountId=id;return this;}
  setOtherExpensesAccountId(id:number){this.otherExpensesAccountId=id;return this;} setInputVatAccountId(id:number){this.inputVatAccountId=id;return this;}
  setRetentionPayableAccountId(id:number){this.retentionPayableAccountId=id;return this;}
  private get common(){return {date:this.vendorCredit.vendorCreditDate,userId:this.vendorCredit.userId,currencyCode:this.vendorCredit.currencyCode,
    exchangeRate:this.vendorCredit.exchangeRate,transactionType:'VendorCredit',transactionId:this.vendorCredit.id,
    transactionNumber:this.vendorCredit.vendorCreditNumber,referenceNumber:this.vendorCredit.referenceNo,createdAt:this.vendorCredit.createdAt,
    indexGroup:10,credit:0,debit:0,branchId:this.vendorCredit.branchId};}
  private local(v:number){return Number(v||0)*Number(this.vendorCredit.exchangeRate||1);}
  private fiscalLine(e:ItemEntry){return calculateSpanishFiscalLine({quantity:Number(e.quantity||0),rate:Number(e.rate||0),lineDiscountType:e.discountType,
    lineDiscount:Number(e.discount||0),vatRate:Number(e.taxRate||0),isInclusiveTax:Boolean(e.isInclusiveTax),fiscalRegime:e.fiscalRegime||'standard',
    equivalenceSurchargeRate:Number(e.equivalenceSurchargeRate||0),retentionRate:Number(e.retentionRate||0),
    documentDiscountAllocation:Number(e.documentDiscountAllocation||0),documentAdjustmentAllocation:Number(e.documentAdjustmentAllocation||0)});}
  private accountFor(e:ItemEntry){return e.item.type==='inventory'?e.item.inventoryAccountId:(e.costAccountId||e.item.costAccountId);}
  private get payable():ILedgerEntry{return {...this.common,debit:this.vendorCredit.totalLocal,accountId:this.APAccountId,contactId:this.vendorCredit.vendorId,
    accountNormal:AccountNormal.CREDIT,index:1,indexGroup:5};}
  private item(e:ItemEntry,i:number):ILedgerEntry{const f=this.fiscalLine(e),base=f.taxableBase+f.discountTaxBaseAmount-f.adjustmentTaxBaseAmount;return {
    ...this.common,credit:this.local(base),accountId:this.accountFor(e),index:i+2,itemId:e.itemId,accountNormal:AccountNormal.DEBIT,
    taxRateId:e.taxRateId,taxRate:e.taxRate};}
  private vat(e:ItemEntry,i:number):ILedgerEntry{const f=this.fiscalLine(e);return {...this.common,credit:this.local(f.vatAmount),accountId:this.inputVatAccountId,
    note:'Rectificación IVA soportado',index:i+1,indexGroup:30,accountNormal:AccountNormal.DEBIT,taxRateId:e.taxRateId,taxRate:e.taxRate};}
  private surcharge(e:ItemEntry,i:number):ILedgerEntry{const f=this.fiscalLine(e);return {...this.common,credit:this.local(f.equivalenceSurchargeAmount),
    accountId:this.accountFor(e),note:'Rectificación recargo de equivalencia soportado',index:i+1,indexGroup:30,accountNormal:AccountNormal.DEBIT};}
  private retention(e:ItemEntry,i:number):ILedgerEntry{const f=this.fiscalLine(e);return {...this.common,debit:this.local(f.retentionAmount),
    accountId:this.retentionPayableAccountId,note:'Rectificación retención practicada',index:i+1,indexGroup:31,accountNormal:AccountNormal.CREDIT};}
  public get discountEntry():ILedgerEntry{const base=(this.vendorCredit.entries||[]).reduce((s,e)=>s+this.fiscalLine(e).discountTaxBaseAmount,0);return {
    ...this.common,debit:this.local(base),accountId:this.purchaseDiscountAccountId,accountNormal:AccountNormal.DEBIT,index:1,indexGroup:40};}
  public get adjustmentEntry():ILedgerEntry{const base=(this.vendorCredit.entries||[]).reduce((s,e)=>s+this.fiscalLine(e).adjustmentTaxBaseAmount,0);
    const local=this.local(base),a=Math.abs(local);return {...this.common,credit:local>0?a:0,debit:local<0?a:0,accountId:this.otherExpensesAccountId,
      accountNormal:AccountNormal.DEBIT,index:1,indexGroup:40};}
  public getVendorCreditGLEntries():ILedgerEntry[]{const es=this.vendorCredit.entries||[];return [this.payable,...es.map((e,i)=>this.item(e,i)),
    ...es.filter(e=>this.fiscalLine(e).vatAmount>0).map((e,i)=>this.vat(e,i)),...es.filter(e=>this.fiscalLine(e).equivalenceSurchargeAmount>0).map((e,i)=>this.surcharge(e,i)),
    ...es.filter(e=>this.fiscalLine(e).retentionAmount>0).map((e,i)=>this.retention(e,i)),this.discountEntry,this.adjustmentEntry];}
  public getVendorCreditLedger():Ledger{return new Ledger(this.getVendorCreditGLEntries());}
}
