import { Inject, Injectable } from '@nestjs/common';
import { keyBy } from 'lodash';
import { calculateSpanishInvoiceFiscal } from '@farocapital/utils';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TaxRateModel } from './models/TaxRate.model';
import { TenantModelProxy } from '../System/models/TenantBaseModel';

@Injectable()
export class ItemEntriesTaxTransactions {
  constructor(
    @Inject(ItemEntry.name)
    private itemEntryModel: TenantModelProxy<typeof ItemEntry>,

    @Inject(TaxRateModel.name)
    private taxRateModel: TenantModelProxy<typeof TaxRateModel>,
  ) {}

  /**
   * Associates the post-discount VAT amount to the document. This delegates to
   * the shared Spanish fiscal engine so backend, frontend and VERI*FACTU use
   * the same taxable bases.
   */
  public assocTaxAmountWithheldFromEntries = (model: any) => {
    return this.assocSpanishFiscalAmountsFromEntries(model);
  };

  /**
   * Associates tax rate id from tax code to entries.
   * @param {any} entries
   */
  public assocTaxRateIdFromCodeToEntries = async (entries: any) => {
    const entriesWithCode = entries.filter((entry) => entry.taxCode);
    const taxCodes = entriesWithCode.map((entry) => entry.taxCode);
    const foundTaxCodes = await this.taxRateModel()
      .query()
      .whereIn('code', taxCodes);

    const taxCodesMap = keyBy(foundTaxCodes, 'code');

    return entries.map((entry) => {
      if (entry.taxCode) {
        entry.taxRateId = taxCodesMap[entry.taxCode]?.id;
      }
      return entry;
    });
  };

  /**
   * Associates tax rate from tax id to entries and snapshots all fiscal fields
   * needed to reproduce an issued invoice even if the tax master changes.
   */
  public assocTaxRateFromTaxIdToEntries = async (entries: ItemEntry[]) => {
    const entriesWithId = entries.filter((e) => e.taxRateId);
    const taxRateIds = entriesWithId.map((e) => e.taxRateId);
    const foundTaxes = await this.taxRateModel()
      .query()
      .whereIn('id', taxRateIds);

    const taxRatesMap = keyBy(foundTaxes, 'id');

    return entries.map((entry) => {
      if (entry.taxRateId) {
        const tax = taxRatesMap[entry.taxRateId];
        entry.taxRate = Number(tax?.rate || 0);
        entry.fiscalRegime = tax?.fiscalRegime || 'standard';
        entry.equivalenceSurchargeRate = Number(
          tax?.equivalenceSurchargeRate || 0,
        );
        entry.retentionRate = Number(tax?.retentionRate || 0);
        entry.aeatTaxCode = tax?.aeatTaxCode || '01';
        entry.aeatRegimeKey = tax?.aeatRegimeKey || '01';
        entry.aeatOperationQualification = tax?.aeatOperationQualification;
        entry.aeatExemptionCause = tax?.aeatExemptionCause;
        entry.spanishOperationType = tax?.spanishOperationType || 'domestic';
        entry.ossScheme = tax?.ossScheme;
        entry.taxTerritory = tax?.taxTerritory || 'iva';
      } else {
        // Tax-free lines still carry an explicit standard snapshot.
        entry.taxRate = Number(entry.taxRate || 0);
        entry.fiscalRegime = entry.fiscalRegime || 'standard';
        entry.equivalenceSurchargeRate = Number(
          entry.equivalenceSurchargeRate || 0,
        );
        entry.retentionRate = Number(entry.retentionRate || 0);
        entry.aeatTaxCode = entry.aeatTaxCode || '01';
        entry.aeatRegimeKey = entry.aeatRegimeKey || '01';
        entry.aeatOperationQualification =
          entry.aeatOperationQualification || 'S1';
        entry.spanishOperationType = entry.spanishOperationType || 'domestic';
        entry.taxTerritory = entry.taxTerritory || 'iva';
      }
      return entry;
    });
  };

  /**
   * Persists the Spanish fiscal totals and each line's proportional share of
   * document-level discount. The calculation order is:
   * quantity×price -> line discount -> document allocation -> taxable base ->
   * VAT -> equivalence surcharge -> IRPF.
   */
  public assocSpanishFiscalAmountsFromEntries = (model: any) => {
    const sourceEntries = (model.entries || []).map((entry) =>
      this.itemEntryModel().fromJson(entry),
    );

    const result = calculateSpanishInvoiceFiscal({
      lines: sourceEntries.map((entry: any) => ({
        quantity: Number(entry.quantity || 0),
        rate: Number(entry.rate || 0),
        lineDiscountType: entry.discountType,
        lineDiscount: Number(entry.discount || 0),
        vatRate: Number(entry.taxRate || 0),
        isInclusiveTax: Boolean(entry.isInclusiveTax ?? model.isInclusiveTax),
        fiscalRegime: entry.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(
          entry.equivalenceSurchargeRate || 0,
        ),
        retentionRate: Number(entry.retentionRate || 0),
      })),
      documentDiscountType: model.discountType,
      documentDiscount: Number(model.discount || 0),
      documentAdjustment: Number(model.adjustment || 0),
    });

    model.entries = (model.entries || []).map((entry, index) => ({
      ...entry,
      documentDiscountAllocation:
        result.lines[index]?.documentDiscountAllocation || 0,
      discountTaxBaseAmount: result.lines[index]?.discountTaxBaseAmount || 0,
      discountTaxAmount: result.lines[index]?.discountTaxAmount || 0,
      documentAdjustmentAllocation:
        result.lines[index]?.documentAdjustmentAllocation || 0,
      adjustmentTaxBaseAmount:
        result.lines[index]?.adjustmentTaxBaseAmount || 0,
    }));

    // SaleInvoice stores its pre-document-discount subtotal in `balance`, while
    // purchase/credit documents store it in `amount`. Do not assign to a
    // getter-only `balance` (Bill), which would fail at runtime.
    if (Object.prototype.hasOwnProperty.call(model, 'balance')) {
      model.balance = result.subtotal;
    } else {
      model.amount = result.subtotal;
    }
    model.taxAmountWithheld = result.vatAmount;
    model.equivalenceSurchargeAmount = result.equivalenceSurchargeAmount;
    model.retentionAmount = result.retentionAmount;
    return model;
  };
}
