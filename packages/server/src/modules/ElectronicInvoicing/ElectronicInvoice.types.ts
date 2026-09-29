export type ElectronicInvoiceFormat = 'facturae-3.2.2' | 'ubl-2.1';
export type ElectronicInvoiceProfile = 'face' | 'b2b-public' | 'b2b-private';

export interface ElectronicInvoicePartyAddress {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
}

export interface ElectronicInvoiceParty {
  personType?: 'J' | 'F';
  name: string;
  taxNumber: string;
  countryCode: string;
  email?: string;
  address: ElectronicInvoicePartyAddress;
}

export interface ElectronicInvoiceDir3 {
  accountingOffice?: string;
  managementBody?: string;
  processingUnit?: string;
  proposingBody?: string;
}

export interface ElectronicInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  grossAmount: number;
  allowanceAmount: number;
  chargeAmount: number;
  netAmount: number;
  vatRate: number;
  vatCategory: string;
  vatAmount: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
  fiscalRegime: string;
}

export interface ElectronicInvoiceTaxBreakdown {
  vatRate: number;
  vatCategory: string;
  fiscalRegime: string;
  taxableBase: number;
  vatAmount: number;
  equivalenceSurchargeAmount: number;
  retentionAmount: number;
}

export interface ElectronicInvoiceCanonical {
  semanticModel: 'EN16931';
  profileVersion: string;
  sourceInvoiceId: number;
  invoiceNo: string;
  issueDate: string;
  operationDate?: string;
  dueDate?: string;
  currencyCode: string;
  invoiceType: '380';
  seller: ElectronicInvoiceParty;
  buyer: ElectronicInvoiceParty;
  dir3?: ElectronicInvoiceDir3;
  references: {
    purchaseOrder?: string;
    contract?: string;
    receiverTransaction?: string;
    generalReference?: string;
  };
  notes?: string;
  lines: ElectronicInvoiceLine[];
  taxes: ElectronicInvoiceTaxBreakdown[];
  totals: {
    lineExtensionAmount: number;
    allowanceTotalAmount: number;
    chargeTotalAmount: number;
    taxExclusiveAmount: number;
    vatAmount: number;
    equivalenceSurchargeAmount: number;
    retentionAmount: number;
    taxInclusiveAmount: number;
    payableAmount: number;
  };
}
