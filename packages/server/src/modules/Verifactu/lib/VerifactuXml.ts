import {
  NS_SUMINISTRO_INFO,
  NS_SUMINISTRO_LR,
  VERIFACTU_RECORD_VERSION,
} from '../Verifactu.constants';
import {
  VerifactuBreakdown,
  VerifactuRecordData,
} from '../Verifactu.types';
import { formatMoney } from './VerifactuHash';
const NS_CONSULTA_LR = 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/ConsultaLR.xsd';

const xmlEscape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const el = (name: string, value: unknown) =>
  `<sum1:${name}>${xmlEscape(value)}</sum1:${name}>`;

function renderChain(data: VerifactuRecordData): string {
  if (!data.previous) {
    return '<sum1:Encadenamiento><sum1:PrimerRegistro>S</sum1:PrimerRegistro></sum1:Encadenamiento>';
  }
  return [
    '<sum1:Encadenamiento><sum1:RegistroAnterior>',
    el('IDEmisorFactura', data.previous.issuerNif),
    el('NumSerieFactura', data.previous.invoiceNo.slice(0, 60)),
    el('FechaExpedicionFactura', data.previous.invoiceDate),
    el('Huella', data.previous.hash),
    '</sum1:RegistroAnterior></sum1:Encadenamiento>',
  ].join('');
}

function renderSystem(data: VerifactuRecordData): string {
  const system = data.system;
  return [
    '<sum1:SistemaInformatico>',
    el('NombreRazon', system.producerName.slice(0, 120)),
    el('NIF', system.producerTaxNumber),
    el('NombreSistemaInformatico', system.systemName.slice(0, 30)),
    el('IdSistemaInformatico', system.systemId.slice(0, 2)),
    el('Version', system.version.slice(0, 50)),
    el('NumeroInstalacion', system.installationNumber.slice(0, 100)),
    el('TipoUsoPosibleSoloVerifactu', 'S'),
    el('TipoUsoPosibleMultiOT', 'N'),
    el('IndicadorMultiplesOT', 'N'),
    '</sum1:SistemaInformatico>',
  ].join('');
}

function renderBreakdown(breakdown: VerifactuBreakdown): string {
  const out: string[] = ['<sum1:DetalleDesglose>'];
  // Keep exact XSD sequence.
  out.push(el('Impuesto', breakdown.impuesto));
  out.push(el('ClaveRegimen', breakdown.claveRegimen));
  if (breakdown.operacionExenta) {
    out.push(el('OperacionExenta', breakdown.operacionExenta));
  } else if (breakdown.calificacionOperacion) {
    out.push(el('CalificacionOperacion', breakdown.calificacionOperacion));
  }

  const nonSubject = ['N1', 'N2'].includes(
    String(breakdown.calificacionOperacion || ''),
  );
  const subjectNonExempt = !breakdown.operacionExenta && !nonSubject;
  if (subjectNonExempt) {
    out.push(el('TipoImpositivo', formatMoney(breakdown.tipoImpositivo || 0)));
  }
  out.push(el('BaseImponibleOimporteNoSujeto', formatMoney(breakdown.base)));
  if (subjectNonExempt) {
    out.push(el('CuotaRepercutida', formatMoney(breakdown.cuotaRepercutida || 0)));
    if (Number(breakdown.tipoRecargoEquivalencia || 0) > 0) {
      out.push(
        el(
          'TipoRecargoEquivalencia',
          formatMoney(breakdown.tipoRecargoEquivalencia || 0),
        ),
      );
      out.push(
        el(
          'CuotaRecargoEquivalencia',
          formatMoney(breakdown.cuotaRecargoEquivalencia || 0),
        ),
      );
    }
  }
  out.push('</sum1:DetalleDesglose>');
  return out.join('');
}

export function renderVerifactuRecordXml(
  data: VerifactuRecordData,
  hash: string,
): string {
  if (data.event === 'anulacion') {
    return [
      '<sum1:RegistroAnulacion>',
      el('IDVersion', VERIFACTU_RECORD_VERSION),
      '<sum1:IDFactura>',
      el('IDEmisorFacturaAnulada', data.issuerNif),
      el('NumSerieFacturaAnulada', data.invoiceNo.slice(0, 60)),
      el('FechaExpedicionFacturaAnulada', data.invoiceDate),
      '</sum1:IDFactura>',
      el('SinRegistroPrevio', 'N'),
      ...(data.rejectionPrevious ? [el('RechazoPrevio', 'S')] : []),
      renderChain(data),
      renderSystem(data),
      el('FechaHoraHusoGenRegistro', data.generationTimestamp),
      el('TipoHuella', '01'),
      el('Huella', hash),
      '</sum1:RegistroAnulacion>',
    ].join('');
  }

  const out: string[] = [
    '<sum1:RegistroAlta>',
    el('IDVersion', VERIFACTU_RECORD_VERSION),
    '<sum1:IDFactura>',
    el('IDEmisorFactura', data.issuerNif),
    el('NumSerieFactura', data.invoiceNo.slice(0, 60)),
    el('FechaExpedicionFactura', data.invoiceDate),
    '</sum1:IDFactura>',
    el('NombreRazonEmisor', data.issuerName.slice(0, 120)),
    el('Subsanacion', data.event === 'subsanacion' ? 'S' : 'N'),
  ];
  if (data.event === 'subsanacion') {
    out.push(el('RechazoPrevio', data.rejectionPrevious ? 'S' : 'N'));
  }
  out.push(
    el('TipoFactura', data.invoiceType),
    el('DescripcionOperacion', data.description.slice(0, 500)),
  );
  if (data.invoiceType !== 'F2' && data.customerName && data.customerNif) {
    out.push(
      '<sum1:Destinatarios><sum1:IDDestinatario>',
      el('NombreRazon', data.customerName.slice(0, 120)),
    );
    if ((data.customerCountry || 'ES').toUpperCase() === 'ES') {
      out.push(el('NIF', data.customerNif));
    } else {
      out.push(
        '<sum1:IDOtro>',
        el('CodigoPais', String(data.customerCountry).toUpperCase().slice(0, 2)),
        el('IDType', data.customerAeatIdType || '06'),
        el('ID', data.customerNif),
        '</sum1:IDOtro>',
      );
    }
    out.push('</sum1:IDDestinatario></sum1:Destinatarios>');
  }
  out.push('<sum1:Desglose>');
  for (const breakdown of data.breakdowns) out.push(renderBreakdown(breakdown));
  out.push(
    '</sum1:Desglose>',
    el('CuotaTotal', formatMoney(data.taxTotal)),
    el('ImporteTotal', formatMoney(data.invoiceTotal)),
    renderChain(data),
    renderSystem(data),
    el('FechaHoraHusoGenRegistro', data.generationTimestamp),
    el('TipoHuella', '01'),
    el('Huella', hash),
    '</sum1:RegistroAlta>',
  );
  return out.join('');
}

export function renderVerifactuEnvelope(input: {
  issuerName: string;
  issuerNif: string;
  recordXml: string;
}): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sfLR:RegFactuSistemaFacturacion xmlns:sfLR="${NS_SUMINISTRO_LR}" xmlns:sum1="${NS_SUMINISTRO_INFO}">`,
    '<sfLR:Cabecera><sum1:ObligadoEmision>',
    el('NombreRazon', input.issuerName.slice(0, 120)),
    el('NIF', input.issuerNif),
    '</sum1:ObligadoEmision></sfLR:Cabecera>',
    '<sfLR:RegistroFactura>',
    input.recordXml,
    '</sfLR:RegistroFactura>',
    '</sfLR:RegFactuSistemaFacturacion>',
  ].join('');
}

export function renderVerifactuQueryEnvelope(input: {
  issuerName: string;
  issuerNif: string;
  invoiceNo: string;
  invoiceDate: string;
}): string {
  const parts = input.invoiceDate.split('-');
  if (parts.length !== 3) throw new Error('VERIFACTU_QUERY_INVALID_DATE');
  const [day, month, year] = parts;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sfLRC:ConsultaFactuSistemaFacturacion xmlns:sfLRC="${NS_CONSULTA_LR}" xmlns:sum1="${NS_SUMINISTRO_INFO}">`,
    '<sfLRC:Cabecera>',
    el('IDVersion', VERIFACTU_RECORD_VERSION),
    '<sum1:ObligadoEmision>',
    el('NombreRazon', input.issuerName.slice(0, 120)),
    el('NIF', input.issuerNif),
    '</sum1:ObligadoEmision>',
    '</sfLRC:Cabecera>',
    '<sfLRC:FiltroConsulta>',
    '<sfLRC:PeriodoImputacion>',
    el('Ejercicio', year),
    el('Periodo', month),
    '</sfLRC:PeriodoImputacion>',
    `<sfLRC:NumSerieFactura>${xmlEscape(input.invoiceNo.slice(0, 60))}</sfLRC:NumSerieFactura>`,
    '<sfLRC:FechaExpedicionFactura>',
    el('FechaExpedicionFactura', `${day}-${month}-${year}`),
    '</sfLRC:FechaExpedicionFactura>',
    '</sfLRC:FiltroConsulta>',
    '<sfLRC:DatosAdicionalesRespuesta>',
    '<sfLRC:MostrarNombreRazonEmisor>S</sfLRC:MostrarNombreRazonEmisor>',
    '<sfLRC:MostrarSistemaInformatico>S</sfLRC:MostrarSistemaInformatico>',
    '</sfLRC:DatosAdicionalesRespuesta>',
    '</sfLRC:ConsultaFactuSistemaFacturacion>',
  ].join('');
}

export function renderSoapEnvelope(payloadXml: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">',
    '<soapenv:Header/>',
    '<soapenv:Body>',
    payloadXml.replace(/^<\?xml[^>]*>\s*/i, ''),
    '</soapenv:Body></soapenv:Envelope>',
  ].join('');
}
