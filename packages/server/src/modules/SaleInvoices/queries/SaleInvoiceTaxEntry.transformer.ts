import { Transformer } from '@/modules/Transformer/Transformer';
import { calculateSpanishInvoiceFiscal } from '@farocapital/utils';

export class SaleInvoiceTaxEntryTransformer extends Transformer {
  /**
   * Included attributes.
   * @returns {Array}
   */
  public includeAttributes = (): string[] => {
    return [
      'id',
      'name',
      'taxRateCode',
      'taxRate',
      'taxRateId',
      'taxRateAmount',
      'taxRateAmountFormatted',
    ];
  };

  /**
   * Exclude attributes.
   * @returns {string[]}
   */
  public excludeAttributes = (): string[] => {
    return ['*'];
  };

  /**
   *  Retrieve  tax rate code.
   * @param taxEntry
   * @returns {string}
   */
  protected taxRateCode = (taxEntry) => {
    return taxEntry.taxRate.code;
  };

  /**
   * Retrieve tax rate id.
   * @param taxEntry
   * @returns {number}
   */
  protected taxRate = (taxEntry) => {
    return taxEntry.taxAmount || taxEntry.taxRate.rate;
  };

  /**
   * Retrieve tax rate name.
   * @param taxEntry
   * @returns {string}
   */
  protected name = (taxEntry) => {
    return taxEntry.taxRate.name;
  };

  /**
   * Retrieve tax rate amount.
   * @param taxEntry
   */
  protected taxRateAmount = (taxEntry) => {
    const entries = Array.isArray(this.options.entries) ? this.options.entries : [];
    if (!entries.length) return 0;

    const fiscal = calculateSpanishInvoiceFiscal({
      lines: entries.map((entry: any) => ({
        quantity: Number(entry.quantity || 0),
        rate: Number(entry.rate || 0),
        lineDiscountType: entry.discountType,
        lineDiscount: Number(entry.discount || 0),
        vatRate: Number(entry.taxRate || 0),
        isInclusiveTax: Boolean(entry.isInclusiveTax ?? this.options.isInclusiveTax),
        fiscalRegime: entry.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
        retentionRate: Number(entry.retentionRate || 0),
      })),
      documentDiscountType: this.options.discountType,
      documentDiscount: Number(this.options.discount || 0),
      documentAdjustment: Number(this.options.adjustment || 0),
    });

    return entries.reduce((sum: number, entry: any, index: number) => {
      return String(entry.taxRateId || '') === String(taxEntry.taxRateId || '')
        ? sum + Number(fiscal.lines[index]?.vatAmount || 0)
        : sum;
    }, 0);
  };

  /**
   * Retrieve formatted tax rate amount.
   * @returns {string}
   */
  protected taxRateAmountFormatted = (taxEntry) => {
    return this.formatNumber(this.taxRateAmount(taxEntry), {
      currencyCode: this.options.currencyCode,
    });
  };
}
