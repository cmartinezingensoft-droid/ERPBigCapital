const esc = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xml = (tag: string, value: unknown) => `<${tag}>${esc(value)}</${tag}>`;
const opt = (tag: string, value: unknown) => value === undefined || value === null || value === '' ? '' : xml(tag, value);
const date = (value: string) => {
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return [d, m, y].filter(Boolean).join('-');
};
const money = (value: number) => Number(value || 0).toFixed(2);

// The SII 1.1 WSDL keeps the stable, non-versioned XML namespaces.
// The versioned /ssii_1_1(_bis)/ paths are schema locations, not target namespaces.
const SII_LR_NS = 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd';
const SII_INFO_NS = 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd';

export interface SiiParty { name: string; taxNumber: string; countryCode?: string; idType?: string; }
export interface SiiTaxLine {
  rate: number;
  base: number;
  vat: number;
  surcharge?: number;
  surchargeRate?: number;
  regimeKey?: string;
  qualification?: string;
  exemptionCause?: string;
  operationType?: string;
}
export interface SiiInvoicePayload {
  direction: 'issued' | 'received';
  issuer: SiiParty;
  counterparty?: SiiParty;
  invoiceNumber: string;
  invoiceDate: string;
  operationDate?: string;
  accountingDate?: string;
  invoiceType?: string;
  description?: string;
  periodYear: string;
  periodMonth: string;
  regimeKey?: string;
  total: number;
  deductibleVat?: number;
  lines: SiiTaxLine[];
}

const partyId = (party?: SiiParty) => {
  if (!party?.taxNumber) return '';
  const country = String(party.countryCode || 'ES').toUpperCase();
  return country === 'ES'
    ? xml('sii:NIF', party.taxNumber)
    : `<sii:IDOtro>${xml('sii:CodigoPais', country)}${xml('sii:IDType', party.idType || '02')}${xml('sii:ID', party.taxNumber)}</sii:IDOtro>`;
};

const party = (value?: SiiParty) => value
  ? `<sii:Contraparte>${xml('sii:NombreRazon', value.name)}${partyId(value)}</sii:Contraparte>`
  : '';

const issuedDetail = (lines: SiiTaxLine[]) => {
  const exempt = lines.filter((line) => Boolean(line.exemptionCause));
  const noSubject = lines.filter((line) => line.qualification === 'N1' || line.qualification === 'N2');
  const taxable = lines.filter((line) => !line.exemptionCause && line.qualification !== 'N1' && line.qualification !== 'N2');

  const exemptXml = exempt.length
    ? `<sii:Exenta>${exempt.map((line) => `<sii:DetalleExenta>${opt('sii:CausaExencion', line.exemptionCause)}${xml('sii:BaseImponible', money(line.base))}</sii:DetalleExenta>`).join('')}</sii:Exenta>`
    : '';
  const taxableXml = taxable.length
    ? `<sii:NoExenta>${xml('sii:TipoNoExenta', taxable.some((line) => line.qualification === 'S2') ? 'S2' : 'S1')}<sii:DesgloseIVA>${taxable.map((line) => `<sii:DetalleIVA>${xml('sii:TipoImpositivo', money(line.rate))}${xml('sii:BaseImponible', money(line.base))}${xml('sii:CuotaRepercutida', money(line.vat))}${line.surcharge ? `${xml('sii:TipoRecargoEquivalencia', money(line.surchargeRate || 0))}${xml('sii:CuotaRecargoEquivalencia', money(line.surcharge))}` : ''}</sii:DetalleIVA>`).join('')}</sii:DesgloseIVA></sii:NoExenta>`
    : '';
  const subjectXml = exemptXml || taxableXml ? `<sii:Sujeta>${exemptXml}${taxableXml}</sii:Sujeta>` : '';

  const n1 = noSubject.filter((line) => line.qualification === 'N1').reduce((sum, line) => sum + Number(line.base || 0), 0);
  const n2 = noSubject.filter((line) => line.qualification === 'N2').reduce((sum, line) => sum + Number(line.base || 0), 0);
  const noSubjectXml = noSubject.length
    ? `<sii:NoSujeta>${n1 ? xml('sii:ImportePorArticulos7_14_Otros', money(n1)) : ''}${n2 ? xml('sii:ImporteTAIReglasLocalizacion', money(n2)) : ''}</sii:NoSujeta>`
    : '';

  return `<sii:TipoDesglose><sii:DesgloseFactura>${subjectXml}${noSubjectXml}</sii:DesgloseFactura></sii:TipoDesglose>`;
};

const receivedDetail = (lines: SiiTaxLine[]) => {
  const reverse = lines.filter((line) => line.operationType === 'domestic_reverse_charge');
  const ordinary = lines.filter((line) => line.operationType !== 'domestic_reverse_charge');
  const detail = (line: SiiTaxLine) => `<sii:DetalleIVA>${xml('sii:TipoImpositivo', money(line.rate))}${xml('sii:BaseImponible', money(line.base))}${xml('sii:CuotaSoportada', money(line.vat))}${line.surcharge ? `${xml('sii:TipoRecargoEquivalencia', money(line.surchargeRate || 0))}${xml('sii:CuotaRecargoEquivalencia', money(line.surcharge))}` : ''}</sii:DetalleIVA>`;
  return `<sii:DesgloseFactura>` +
    (reverse.length ? `<sii:InversionSujetoPasivo>${reverse.map(detail).join('')}</sii:InversionSujetoPasivo>` : '') +
    (ordinary.length ? `<sii:DesgloseIVA>${ordinary.map(detail).join('')}</sii:DesgloseIVA>` : '') +
    `</sii:DesgloseFactura>`;
};

export const renderSiiInvoiceEnvelope = (input: SiiInvoicePayload) => {
  const isIssued = input.direction === 'issued';
  const bodyTag = isIssued ? 'siiLR:SuministroLRFacturasEmitidas' : 'siiLR:SuministroLRFacturasRecibidas';
  const recordTag = isIssued ? 'siiLR:RegistroLRFacturasEmitidas' : 'siiLR:RegistroLRFacturasRecibidas';
  const invoiceTag = isIssued ? 'siiLR:FacturaExpedida' : 'siiLR:FacturaRecibida';
  const idParty = isIssued ? input.issuer : input.counterparty;
  if (!isIssued && !idParty?.taxNumber) throw new Error('SII_RECEIVED_INVOICE_ISSUER_REQUIRED');
  if (!isIssued && !input.counterparty) throw new Error('SII_RECEIVED_INVOICE_COUNTERPARTY_REQUIRED');

  const common = `${xml('sii:TipoFactura', input.invoiceType || 'F1')}` +
    `${input.operationDate ? xml('sii:FechaOperacion', date(input.operationDate)) : ''}` +
    `${xml('sii:ClaveRegimenEspecialOTrascendencia', input.regimeKey || '01')}` +
    `${xml('sii:ImporteTotal', money(input.total))}` +
    `${xml('sii:DescripcionOperacion', input.description || 'Factura')}`;

  const invoiceData = isIssued
    ? `${common}${party(input.counterparty)}${issuedDetail(input.lines)}`
    : `${common}${receivedDetail(input.lines)}${party(input.counterparty)}${xml('sii:FechaRegContable', date(input.accountingDate || input.invoiceDate))}${xml('sii:CuotaDeducible', money(input.deductibleVat ?? input.lines.reduce((sum, line) => sum + Number(line.vat || 0), 0)))}`;

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:siiLR="${SII_LR_NS}" xmlns:sii="${SII_INFO_NS}">` +
    `<soapenv:Header/><soapenv:Body><${bodyTag}>` +
    `<sii:Cabecera>${xml('sii:IDVersionSii', '1.1')}<sii:Titular>${xml('sii:NombreRazon', input.issuer.name)}${xml('sii:NIF', input.issuer.taxNumber)}</sii:Titular>${xml('sii:TipoComunicacion', 'A0')}</sii:Cabecera>` +
    `<${recordTag}><sii:PeriodoLiquidacion>${xml('sii:Ejercicio', input.periodYear)}${xml('sii:Periodo', input.periodMonth)}</sii:PeriodoLiquidacion>` +
    `<siiLR:IDFactura><sii:IDEmisorFactura>${partyId(idParty)}</sii:IDEmisorFactura>${xml('sii:NumSerieFacturaEmisor', input.invoiceNumber)}${xml('sii:FechaExpedicionFacturaEmisor', date(input.invoiceDate))}</siiLR:IDFactura>` +
    `<${invoiceTag}>${invoiceData}</${invoiceTag}></${recordTag}>` +
    `</${bodyTag}></soapenv:Body></soapenv:Envelope>`;
};

export interface SiiPaymentPayload {
  direction: 'issued' | 'received';
  issuer: SiiParty;
  invoiceIssuerTaxNumber: string;
  invoiceIssuerName?: string;
  invoiceIssuerCountryCode?: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentDate: string;
  amount: number;
  methodCode: string;
  bankReference?: string;
  periodYear: string;
  periodMonth: string;
}

export const renderSiiPaymentEnvelope = (input: SiiPaymentPayload) => {
  const issued = input.direction === 'issued';
  const bodyTag = issued ? 'siiLR:SuministroLRCobrosEmitidas' : 'siiLR:SuministroLRPagosRecibidas';
  const recordTag = issued ? 'siiLR:RegistroLRCobros' : 'siiLR:RegistroLRPagos';
  const movementTag = issued ? 'siiLR:Cobros' : 'siiLR:Pagos';
  const movement = issued ? 'sii:Cobro' : 'sii:Pago';
  const invoiceIssuer = issued
    ? `<sii:NIF>${esc(input.invoiceIssuerTaxNumber)}</sii:NIF>`
    : `${xml('sii:NombreRazon', input.invoiceIssuerName || input.invoiceIssuerTaxNumber)}${partyId({
        name: input.invoiceIssuerName || input.invoiceIssuerTaxNumber,
        taxNumber: input.invoiceIssuerTaxNumber,
        countryCode: input.invoiceIssuerCountryCode || 'ES',
      })}`;

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:siiLR="${SII_LR_NS}" xmlns:sii="${SII_INFO_NS}"><soapenv:Header/><soapenv:Body><${bodyTag}>` +
    `<sii:Cabecera>${xml('sii:IDVersionSii', '1.1')}<sii:Titular>${xml('sii:NombreRazon', input.issuer.name)}${xml('sii:NIF', input.issuer.taxNumber)}</sii:Titular></sii:Cabecera>` +
    `<${recordTag}><siiLR:IDFactura><sii:IDEmisorFactura>${invoiceIssuer}</sii:IDEmisorFactura>${xml('sii:NumSerieFacturaEmisor', input.invoiceNumber)}${xml('sii:FechaExpedicionFacturaEmisor', date(input.invoiceDate))}</siiLR:IDFactura>` +
    `<${movementTag}><${movement}>${xml('sii:Fecha', date(input.paymentDate))}${xml('sii:Importe', money(input.amount))}${xml('sii:Medio', input.methodCode || '04')}${opt('sii:Cuenta_O_Medio', input.bankReference)}</${movement}></${movementTag}>` +
    `</${recordTag}></${bodyTag}></soapenv:Body></soapenv:Envelope>`;
};
