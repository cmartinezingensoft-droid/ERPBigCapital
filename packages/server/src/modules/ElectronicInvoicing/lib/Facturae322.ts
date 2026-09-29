import { ElectronicInvoiceCanonical } from '../ElectronicInvoice.types';
import { money, price, quantity, xml, xmlEscape, xmlOptional } from './xml';

const legalEntity = (party: ElectronicInvoiceCanonical['seller']) => {
  const inSpain = party.countryCode === 'ES';
  const address = party.address;
  const addressXml = inSpain
    ? `<AddressInSpain>${xml('Address', address.address1 || '-')}${xmlOptional('PostCode', address.postalCode)}${xmlOptional('Town', address.city)}${xmlOptional('Province', address.state)}${xml('CountryCode', 'ESP')}</AddressInSpain>`
    : `<OverseasAddress>${xml('Address', address.address1 || '-')}${xmlOptional('PostCodeAndTown', [address.postalCode, address.city].filter(Boolean).join(' '))}${xmlOptional('Province', address.state)}${xml('CountryCode', party.countryCode || 'ES')}</OverseasAddress>`;
  return `<TaxIdentification>${xml('PersonTypeCode', party.personType || 'J')}${xml('ResidenceTypeCode', inSpain ? 'R' : 'E')}${xml('TaxIdentificationNumber', party.taxNumber)}</TaxIdentification><LegalEntity>${xml('CorporateName', party.name)}${addressXml}</LegalEntity>`;
};

const administrativeCentre = (code: string | undefined, role: string, name: string) =>
  !code
    ? ''
    : `<AdministrativeCentre>${xml('CentreCode', code)}${xml('RoleTypeCode', role)}${xml('Name', name)}</AdministrativeCentre>`;

const taxOutputs = (invoice: ElectronicInvoiceCanonical) => {
  const rows = invoice.taxes
    .filter((tax) => tax.fiscalRegime !== 'not_subject')
    .map((tax) => `<Tax>${xml('TaxTypeCode', '01')}${xml('TaxRate', money(tax.vatRate))}<TaxableBase>${xml('TotalAmount', money(tax.taxableBase))}</TaxableBase><TaxAmount>${xml('TotalAmount', money(tax.vatAmount))}</TaxAmount>${tax.equivalenceSurchargeAmount ? `${xml('EquivalenceSurcharge', money(tax.taxableBase ? (tax.equivalenceSurchargeAmount / tax.taxableBase) * 100 : 0))}${xml('EquivalenceSurchargeAmount', money(tax.equivalenceSurchargeAmount))}` : ''}</Tax>`)
    .join('');
  return rows ? `<TaxesOutputs>${rows}</TaxesOutputs>` : '';
};

const taxesWithheld = (invoice: ElectronicInvoiceCanonical) => {
  const rows = invoice.taxes
    .filter((tax) => tax.retentionAmount > 0)
    .map((tax) => `<Tax>${xml('TaxTypeCode', '04')}${xml('TaxRate', money(tax.taxableBase ? (tax.retentionAmount / tax.taxableBase) * 100 : 0))}<TaxableBase>${xml('TotalAmount', money(tax.taxableBase))}</TaxableBase><TaxAmount>${xml('TotalAmount', money(tax.retentionAmount))}</TaxAmount></Tax>`)
    .join('');
  return rows ? `<TaxesWithheld>${rows}</TaxesWithheld>` : '';
};

const invoiceLines = (invoice: ElectronicInvoiceCanonical) =>
  invoice.lines
    .map((line) => {
      const discount = line.allowanceAmount > 0
        ? `<DiscountsAndRebates><Discount>${xml('DiscountReason', 'Descuento comercial / prorrata de descuento global')}${xml('DiscountAmount', money(line.allowanceAmount))}</Discount></DiscountsAndRebates>`
        : '';
      const charge = line.chargeAmount > 0
        ? `<Charges><Charge>${xml('ChargeReason', 'Ajuste / cargo')}${xml('ChargeAmount', money(line.chargeAmount))}</Charge></Charges>`
        : '';
      const lineTax = line.fiscalRegime === 'not_subject'
        ? ''
        : `<TaxesOutputs><Tax>${xml('TaxTypeCode', '01')}${xml('TaxRate', money(line.vatRate))}<TaxableBase>${xml('TotalAmount', money(line.netAmount))}</TaxableBase><TaxAmount>${xml('TotalAmount', money(line.vatAmount))}</TaxAmount>${line.equivalenceSurchargeAmount > 0 ? `${xml('EquivalenceSurcharge', money(line.netAmount ? (line.equivalenceSurchargeAmount / line.netAmount) * 100 : 0))}${xml('EquivalenceSurchargeAmount', money(line.equivalenceSurchargeAmount))}` : ''}</Tax></TaxesOutputs>`;
      return `<InvoiceLine>${xml('ItemDescription', line.description)}${xml('Quantity', quantity(line.quantity))}${xml('UnitOfMeasure', '01')}${xml('UnitPriceWithoutTax', price(line.unitPrice))}${xml('TotalCost', price(line.grossAmount))}${discount}${charge}${xml('GrossAmount', money(line.netAmount))}${lineTax}</InvoiceLine>`;
    })
    .join('');

export function renderFacturae322(invoice: ElectronicInvoiceCanonical): string {
  const dir3 = invoice.dir3 || {};
  const adminCentres = [
    administrativeCentre(dir3.accountingOffice, '01', 'Oficina Contable'),
    administrativeCentre(dir3.managementBody, '02', 'Órgano Gestor'),
    administrativeCentre(dir3.processingUnit, '03', 'Unidad Tramitadora'),
    administrativeCentre(dir3.proposingBody, '04', 'Órgano Proponente'),
  ].join('');

  const headerTotals = `<TotalInvoicesAmount>${xml('TotalAmount', money(invoice.totals.payableAmount))}</TotalInvoicesAmount><TotalOutstandingAmount>${xml('TotalAmount', money(invoice.totals.payableAmount))}</TotalOutstandingAmount><TotalExecutableAmount>${xml('TotalAmount', money(invoice.totals.payableAmount))}</TotalExecutableAmount>`;
  const invoiceTotals = `<InvoiceTotals>${xml('TotalGrossAmount', money(invoice.totals.lineExtensionAmount))}${xml('TotalGrossAmountBeforeTaxes', money(invoice.totals.taxExclusiveAmount))}${xml('TotalTaxOutputs', money(invoice.totals.vatAmount + invoice.totals.equivalenceSurchargeAmount))}${xml('TotalTaxesWithheld', money(invoice.totals.retentionAmount))}${xml('InvoiceTotal', money(invoice.totals.payableAmount))}${xml('TotalOutstandingAmount', money(invoice.totals.payableAmount))}${xml('TotalExecutableAmount', money(invoice.totals.payableAmount))}</InvoiceTotals>`;

  const payment = invoice.dueDate
    ? `<PaymentDetails><Installment>${xml('InstallmentDueDate', invoice.dueDate)}${xml('InstallmentAmount', money(invoice.totals.payableAmount))}${xml('PaymentMeans', '04')}</Installment></PaymentDetails>`
    : '';

  const ref20 = (value?: string) => value ? String(value).slice(0, 20) : undefined;
  const issueRefs = `${xmlOptional('ReceiverTransactionReference', ref20(invoice.references.receiverTransaction || invoice.references.purchaseOrder))}${xmlOptional('FileReference', ref20(invoice.references.generalReference))}${xmlOptional('ReceiverContractReference', ref20(invoice.references.contract))}`;

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Facturae xmlns="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<FileHeader>${xml('SchemaVersion', '3.2.2')}${xml('Modality', 'I')}${xml('InvoiceIssuerType', 'EM')}<Batch>${xml('BatchIdentifier', invoice.invoiceNo)}${xml('InvoicesCount', 1)}${headerTotals}${xml('InvoiceCurrencyCode', invoice.currencyCode)}</Batch></FileHeader>` +
    `<Parties><SellerParty>${legalEntity(invoice.seller)}</SellerParty><BuyerParty><TaxIdentification>${xml('PersonTypeCode', invoice.buyer.personType || 'J')}${xml('ResidenceTypeCode', invoice.buyer.countryCode === 'ES' ? 'R' : 'E')}${xml('TaxIdentificationNumber', invoice.buyer.taxNumber)}</TaxIdentification>${adminCentres}<LegalEntity>${xml('CorporateName', invoice.buyer.name)}${invoice.buyer.countryCode === 'ES' ? `<AddressInSpain>${xml('Address', invoice.buyer.address.address1 || '-')}${xmlOptional('PostCode', invoice.buyer.address.postalCode)}${xmlOptional('Town', invoice.buyer.address.city)}${xmlOptional('Province', invoice.buyer.address.state)}${xml('CountryCode', 'ESP')}</AddressInSpain>` : `<OverseasAddress>${xml('Address', invoice.buyer.address.address1 || '-')}${xmlOptional('PostCodeAndTown', [invoice.buyer.address.postalCode, invoice.buyer.address.city].filter(Boolean).join(' '))}${xmlOptional('Province', invoice.buyer.address.state)}${xml('CountryCode', invoice.buyer.countryCode)}</OverseasAddress>`}</LegalEntity></BuyerParty></Parties>` +
    `<Invoices><Invoice><InvoiceHeader>${xml('InvoiceNumber', invoice.invoiceNo)}${xml('InvoiceDocumentType', 'FC')}${xml('InvoiceClass', 'OO')}</InvoiceHeader><InvoiceIssueData>${xml('IssueDate', invoice.issueDate)}${xmlOptional('OperationDate', invoice.operationDate)}${xml('InvoiceCurrencyCode', invoice.currencyCode)}${xml('TaxCurrencyCode', invoice.currencyCode)}${xml('LanguageName', 'es')}${xmlOptional('InvoiceDescription', invoice.notes)}${issueRefs}</InvoiceIssueData>${taxOutputs(invoice)}${taxesWithheld(invoice)}${invoiceTotals}<Items>${invoiceLines(invoice)}</Items>${payment}</Invoice></Invoices>` +
    `</Facturae>`;
}
