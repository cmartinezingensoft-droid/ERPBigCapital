export type IItemEntryTransactionType = 'SaleInvoice' | 'Bill' | 'SaleReceipt';

export interface IItemEntryDTO {
  id?: number;
  index?: number;
  itemId: number;
  landedCost?: boolean;
  warehouseId?: number;

  sellAccountId?: number;
  costAccountId?: number;

  projectRefId?: number;
  projectRefType?: ProjectLinkRefType;
  projectRefInvoicedAmount?: number;

  taxRateId?: number;
  taxCode?: string;

  fiscalRegime?: string;
  equivalenceSurchargeRate?: number;
  retentionRate?: number;
  aeatTaxCode?: string;
  aeatRegimeKey?: string;
  aeatOperationQualification?: string;
  aeatExemptionCause?: string;
  spanishOperationType?: string;
  ossScheme?: string;
  taxTerritory?: string;
  documentDiscountAllocation?: number;
  discountTaxBaseAmount?: number;
  discountTaxAmount?: number;
  documentAdjustmentAllocation?: number;
  adjustmentTaxBaseAmount?: number;
}

export enum ProjectLinkRefType {
  Task = 'TASK',
  Bill = 'BILL',
  Expense = 'EXPENSE',
}
