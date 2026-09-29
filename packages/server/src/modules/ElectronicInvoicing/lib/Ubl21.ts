import { ElectronicInvoiceCanonical } from '../ElectronicInvoice.types';
import { money, price, quantity, xml, xmlEscape, xmlOptional } from './xml';

const partyXml = (prefix: string, party: ElectronicInvoiceCanonical['seller'], endpointId?: string) =>
  `<cac:${prefix}><cac:Party>${endpointId ? `<cbc:EndpointID>${xmlEscape(endpointId)}</cbc:EndpointID>` : ''}<cac:PartyName>${xml('cbc:Name', party.name)}</cac:PartyName><cac:PostalAddress>${xmlOptional('cbc:StreetName', party.address.address1)}${xmlOptional('cbc:AdditionalStreetName', party.address.address2)}${xmlOptional('cbc:CityName', party.address.city)}${xmlOptional('cbc:PostalZone', party.address.postalCode)}${xmlOptional('cbc:CountrySubentity', party.address.state)}<cac:Country>${xml('cbc:IdentificationCode', party.countryCode)}</cac:Country></cac:PostalAddress><cac:PartyTaxScheme>${xml('cbc:CompanyID', party.taxNumber)}<cac:TaxScheme>${xml('cbc:ID', 'VAT')}</cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity>${xml('cbc:RegistrationName', party.name)}${xml('cbc:CompanyID', party.taxNumber)}</cac:PartyLegalEntity></cac:Party></cac:${prefix}>`;

const taxCategory = (category: string, rate: number) => {
  const exemptionReason = category === 'E'
    ? 'Operación exenta de IVA conforme a la normativa aplicable'
    : category === 'AE'
      ? 'Inversión del sujeto pasivo'
      : category === 'O'
        ? 'Operación no sujeta a IVA'
        : undefined;

  return `<cac:TaxCategory>${xml('cbc:ID', category)}${xml('cbc:Percent', money(rate))}${exemptionReason ? xml('cbc:TaxExemptionReason', exemptionReason) : ''}<cac:TaxScheme>${xml('cbc:ID', 'VAT')}</cac:TaxScheme></cac:TaxCategory>`;
};

export function renderUbl21(invoice: ElectronicInvoiceCanonical, endpointId?: string): string {
  const taxSubtotals = invoice.taxes
    .map((tax) => `<cac:TaxSubtotal>${xml('cbc:TaxableAmount', money(tax.taxableBase), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:TaxAmount', money(tax.vatAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${taxCategory(tax.vatCategory, tax.vatRate)}</cac:TaxSubtotal>`)
    .join('');

  const lines = invoice.lines.map((line) => {
    const allowances = `${line.allowanceAmount > 0 ? `<cac:AllowanceCharge>${xml('cbc:ChargeIndicator', 'false')}${xml('cbc:AllowanceChargeReason', 'Descuento comercial / prorrata')}${xml('cbc:Amount', money(line.allowanceAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}</cac:AllowanceCharge>` : ''}${line.chargeAmount > 0 ? `<cac:AllowanceCharge>${xml('cbc:ChargeIndicator', 'true')}${xml('cbc:AllowanceChargeReason', 'Ajuste / cargo')}${xml('cbc:Amount', money(line.chargeAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}</cac:AllowanceCharge>` : ''}`;
    return `<cac:InvoiceLine>${xml('cbc:ID', line.id)}${xml('cbc:InvoicedQuantity', quantity(line.quantity), ` unitCode="${line.unitCode}"`)}${xml('cbc:LineExtensionAmount', money(line.netAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${allowances}<cac:Item>${xml('cbc:Name', line.description)}${taxCategory(line.vatCategory, line.vatRate)}</cac:Item><cac:Price>${xml('cbc:PriceAmount', price(line.unitPrice), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}</cac:Price></cac:InvoiceLine>`;
  }).join('');

  const surchargeTax = invoice.totals.equivalenceSurchargeAmount > 0
    ? `<cac:TaxTotal>${xml('cbc:TaxAmount', money(invoice.totals.equivalenceSurchargeAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${invoice.taxes.filter((tax) => tax.equivalenceSurchargeAmount > 0).map((tax) => `<cac:TaxSubtotal>${xml('cbc:TaxableAmount', money(tax.taxableBase), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:TaxAmount', money(tax.equivalenceSurchargeAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}<cac:TaxCategory>${xml('cbc:ID', 'S')}${xml('cbc:Percent', money(tax.taxableBase ? (tax.equivalenceSurchargeAmount / tax.taxableBase) * 100 : 0))}<cac:TaxScheme>${xml('cbc:ID', 'RE')}</cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>`).join('')}</cac:TaxTotal>`
    : '';
  const withholding = invoice.totals.retentionAmount > 0
    ? `<cac:WithholdingTaxTotal>${xml('cbc:TaxAmount', money(invoice.totals.retentionAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}<cac:TaxSubtotal>${xml('cbc:TaxableAmount', money(invoice.totals.taxExclusiveAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:TaxAmount', money(invoice.totals.retentionAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}<cac:TaxCategory>${xml('cbc:ID', 'O')}<cac:TaxScheme>${xml('cbc:ID', 'IRPF')}</cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:WithholdingTaxTotal>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">` +
    xml('cbc:CustomizationID', 'urn:cen.eu:en16931:2017') +
    xml('cbc:ProfileID', 'urn:farocapital:es:b2b:phase7:2026.1') +
    xml('cbc:ID', invoice.invoiceNo) +
    xml('cbc:IssueDate', invoice.issueDate) +
    xmlOptional('cbc:DueDate', invoice.dueDate) +
    xmlOptional('cbc:TaxPointDate', invoice.operationDate) +
    xml('cbc:InvoiceTypeCode', invoice.invoiceType) +
    xmlOptional('cbc:Note', invoice.notes) +
    xml('cbc:DocumentCurrencyCode', invoice.currencyCode) +
    (invoice.references.purchaseOrder ? `<cac:OrderReference>${xml('cbc:ID', invoice.references.purchaseOrder)}</cac:OrderReference>` : '') +
    (invoice.references.contract ? `<cac:ContractDocumentReference>${xml('cbc:ID', invoice.references.contract)}</cac:ContractDocumentReference>` : '') +
    (invoice.references.receiverTransaction ? `<cac:AdditionalDocumentReference>${xml('cbc:ID', invoice.references.receiverTransaction)}${xml('cbc:DocumentDescription', 'Referencia de transacción del receptor')}</cac:AdditionalDocumentReference>` : '') +
    (invoice.references.generalReference ? `<cac:AdditionalDocumentReference>${xml('cbc:ID', invoice.references.generalReference)}${xml('cbc:DocumentDescription', 'Referencia adicional')}</cac:AdditionalDocumentReference>` : '') +
    partyXml('AccountingSupplierParty', invoice.seller) +
    partyXml('AccountingCustomerParty', invoice.buyer, endpointId) +
    `<cac:PaymentMeans>${xml('cbc:PaymentMeansCode', '30')}${xmlOptional('cbc:PaymentDueDate', invoice.dueDate)}</cac:PaymentMeans>` +
    surchargeTax +
    `<cac:TaxTotal>${xml('cbc:TaxAmount', money(invoice.totals.vatAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${taxSubtotals}</cac:TaxTotal>` +
    withholding +
    `<cac:LegalMonetaryTotal>${xml('cbc:LineExtensionAmount', money(invoice.totals.lineExtensionAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:TaxExclusiveAmount', money(invoice.totals.taxExclusiveAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:TaxInclusiveAmount', money(invoice.totals.taxInclusiveAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}${xml('cbc:PayableAmount', money(invoice.totals.payableAmount), ` currencyID="${xmlEscape(invoice.currencyCode)}"`)}</cac:LegalMonetaryTotal>` +
    lines +
    `</Invoice>`;
}
