import { Inject, Injectable } from '@nestjs/common';
import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import {
  ElectronicInvoiceCanonical,
  ElectronicInvoiceLine,
  ElectronicInvoiceTaxBreakdown,
} from './ElectronicInvoice.types';

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const round8 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100000000) / 100000000;

const dateOnly = (value: any): string | undefined => {
  if (!value) return undefined;
  const text = value instanceof Date ? value.toISOString() : String(value);
  return text.slice(0, 10);
};

const vatCategoryFor = (regime: string, rate: number) => {
  if (regime === 'exempt') return 'E';
  if (regime === 'reverse_charge') return 'AE';
  if (regime === 'not_subject') return 'O';
  return Number(rate || 0) === 0 ? 'Z' : 'S';
};

@Injectable()
export class ElectronicInvoiceBuilderService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  async build(invoiceId: number): Promise<ElectronicInvoiceCanonical> {
    const invoice = await this.saleInvoiceModel()
      .query()
      .findById(invoiceId)
      .withGraphFetched('[entries.item, customer]')
      .throwIfNotFound();

    if (!invoice.deliveredAt) {
      throw new Error('EINVOICE_INVOICE_NOT_ISSUED');
    }
    if (invoice.aeatInvoiceType === 'F2') {
      throw new Error('EINVOICE_SIMPLIFIED_INVOICE_NOT_SUPPORTED');
    }

    const metadata = await this.tenancyContext.getTenantMetadata();
    const sellerTaxNumber = String(metadata?.taxNumber || '').trim().toUpperCase();
    const buyer = invoice.customer as any;
    const buyerTaxNumber = String(buyer?.fiscalNumber || '').trim().toUpperCase();
    if (!metadata?.name || !sellerTaxNumber) {
      throw new Error('EINVOICE_SELLER_FISCAL_DATA_REQUIRED');
    }
    if (!buyer?.displayName || !buyerTaxNumber) {
      throw new Error('EINVOICE_BUYER_FISCAL_DATA_REQUIRED');
    }

    const lines: ElectronicInvoiceLine[] = (invoice.entries || []).map((entry: any, index) => {
      const fiscal = calculateSpanishFiscalLine({
        quantity: Number(entry.quantity || 0),
        rate: Number(entry.rate || 0),
        lineDiscountType: entry.discountType,
        lineDiscount: Number(entry.discount || 0),
        vatRate: Number(entry.taxRate || 0),
        isInclusiveTax: Boolean(entry.isInclusiveTax ?? invoice.isInclusiveTax),
        fiscalRegime: entry.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(entry.equivalenceSurchargeRate || 0),
        retentionRate: Number(entry.retentionRate || 0),
        documentDiscountAllocation: Number(entry.documentDiscountAllocation || 0),
        documentAdjustmentAllocation: Number(entry.documentAdjustmentAllocation || 0),
      });
      const quantity = Number(entry.quantity || 0);
      const rate = Number(entry.rate || 0);
      const vatRate = Number(entry.taxRate || 0);
      const regime = String(entry.fiscalRegime || 'standard');
      const inclusive = Boolean(entry.isInclusiveTax ?? invoice.isInclusiveTax) &&
        regime === 'standard' && vatRate > 0;
      const unitPriceWithoutTax = round8(inclusive ? rate / (1 + vatRate / 100) : rate);
      const grossWithoutTax = round8(quantity * unitPriceWithoutTax);
      const baseAfterLineDiscount = round2(
        fiscal.taxableBase + fiscal.discountTaxBaseAmount - fiscal.adjustmentTaxBaseAmount,
      );
      const lineAllowance = Math.max(0, round2(grossWithoutTax - baseAfterLineDiscount));
      const documentAllowance = Math.max(0, round2(fiscal.discountTaxBaseAmount));
      const positiveAdjustment = Math.max(0, round2(fiscal.adjustmentTaxBaseAmount));
      const negativeAdjustment = Math.max(0, round2(-fiscal.adjustmentTaxBaseAmount));
      const allowance = round2(lineAllowance + documentAllowance + negativeAdjustment);
      const charge = positiveAdjustment;
      const net = round2(fiscal.taxableBase);
      return {
        id: String(index + 1),
        description: String(entry.description || entry.item?.name || `Línea ${index + 1}`),
        quantity,
        unitCode: 'C62',
        unitPrice: unitPriceWithoutTax,
        grossAmount: grossWithoutTax,
        allowanceAmount: allowance,
        chargeAmount: charge,
        netAmount: net,
        vatRate: Number(entry.taxRate || 0),
        vatCategory: vatCategoryFor(regime, Number(entry.taxRate || 0)),
        vatAmount: round2(fiscal.vatAmount),
        equivalenceSurchargeAmount: round2(fiscal.equivalenceSurchargeAmount),
        retentionAmount: round2(fiscal.retentionAmount),
        fiscalRegime: regime,
      };
    });

    const taxMap = new Map<string, ElectronicInvoiceTaxBreakdown>();
    lines.forEach((line) => {
      const key = `${line.fiscalRegime}:${line.vatCategory}:${line.vatRate}`;
      const current = taxMap.get(key) || {
        vatRate: line.vatRate,
        vatCategory: line.vatCategory,
        fiscalRegime: line.fiscalRegime,
        taxableBase: 0,
        vatAmount: 0,
        equivalenceSurchargeAmount: 0,
        retentionAmount: 0,
      };
      current.taxableBase = round2(current.taxableBase + line.netAmount);
      current.vatAmount = round2(current.vatAmount + line.vatAmount);
      current.equivalenceSurchargeAmount = round2(
        current.equivalenceSurchargeAmount + line.equivalenceSurchargeAmount,
      );
      current.retentionAmount = round2(current.retentionAmount + line.retentionAmount);
      taxMap.set(key, current);
    });
    const taxes = [...taxMap.values()];

    const taxExclusiveAmount = round2(lines.reduce((s, l) => s + l.netAmount, 0));
    const vatAmount = round2(taxes.reduce((s, t) => s + t.vatAmount, 0));
    const surchargeAmount = round2(
      taxes.reduce((s, t) => s + t.equivalenceSurchargeAmount, 0),
    );
    const retentionAmount = round2(taxes.reduce((s, t) => s + t.retentionAmount, 0));
    const payableAmount = round2(
      taxExclusiveAmount + vatAmount + surchargeAmount - retentionAmount,
    );

    const sellerCountry = String(metadata?.location || 'ES').slice(0, 2).toUpperCase();
    const buyerCountry = String(buyer?.fiscalCountry || buyer?.billingAddressCountry || 'ES')
      .slice(0, 2)
      .toUpperCase();

    return {
      semanticModel: 'EN16931',
      profileVersion: 'FAROCAPITAL-ES-EN16931-2026.1',
      sourceInvoiceId: Number(invoice.id),
      invoiceNo: String(invoice.invoiceNo || ''),
      issueDate: dateOnly(invoice.invoiceDate)!,
      operationDate: dateOnly((invoice as any).operationDate),
      dueDate: dateOnly(invoice.dueDate),
      currencyCode: String(invoice.currencyCode || metadata?.baseCurrency || 'EUR'),
      invoiceType: '380',
      seller: {
        personType: 'J',
        name: String(metadata.name),
        taxNumber: sellerTaxNumber,
        countryCode: sellerCountry || 'ES',
        address: {
          address1: metadata.address?.address1,
          address2: metadata.address?.address2,
          city: metadata.address?.city,
          state: metadata.address?.stateProvince,
          postalCode: metadata.address?.postalCode,
          countryCode: sellerCountry || 'ES',
        },
      },
      buyer: {
        personType: buyer?.contactType === 'individual' ? 'F' : 'J',
        name: String(buyer.displayName),
        taxNumber: buyerTaxNumber,
        countryCode: buyerCountry || 'ES',
        email: buyer.email || buyer.billingAddressEmail,
        address: {
          address1: buyer.billingAddress1,
          address2: buyer.billingAddress2,
          city: buyer.billingAddressCity,
          state: buyer.billingAddressState,
          postalCode: buyer.billingAddressPostcode,
          countryCode: buyerCountry || 'ES',
        },
      },
      dir3: {
        accountingOffice: buyer.dir3AccountingOffice,
        managementBody: buyer.dir3ManagementBody,
        processingUnit: buyer.dir3ProcessingUnit,
        proposingBody: buyer.dir3ProposingBody,
      },
      references: {
        purchaseOrder: (invoice as any).purchaseOrderReference,
        contract: (invoice as any).receiverContractReference,
        receiverTransaction: (invoice as any).receiverTransactionReference,
        generalReference: invoice.referenceNo,
      },
      notes: (invoice as any).invoiceMessage || undefined,
      lines,
      taxes,
      totals: {
        lineExtensionAmount: taxExclusiveAmount,
        allowanceTotalAmount: round2(lines.reduce((s, l) => s + l.allowanceAmount, 0)),
        chargeTotalAmount: round2(lines.reduce((s, l) => s + l.chargeAmount, 0)),
        taxExclusiveAmount,
        vatAmount,
        equivalenceSurchargeAmount: surchargeAmount,
        retentionAmount,
        taxInclusiveAmount: round2(taxExclusiveAmount + vatAmount + surchargeAmount),
        payableAmount,
      },
    };
  }
}
