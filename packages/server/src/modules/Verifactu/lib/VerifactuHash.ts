import { createHash } from 'crypto';
import { VerifactuEvent } from '../Verifactu.types';

const val = (value: unknown) => String(value ?? '').trim();

export function buildVerifactuHashInput(input: {
  event: VerifactuEvent;
  issuerNif: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceType?: string;
  taxTotal?: number | string;
  invoiceTotal?: number | string;
  previousHash?: string;
  generationTimestamp: string;
}): string {
  if (input.event === 'anulacion') {
    return [
      ['IDEmisorFacturaAnulada', input.issuerNif],
      ['NumSerieFacturaAnulada', input.invoiceNo],
      ['FechaExpedicionFacturaAnulada', input.invoiceDate],
      ['Huella', input.previousHash || ''],
      ['FechaHoraHusoGenRegistro', input.generationTimestamp],
    ]
      .map(([key, value]) => `${key}=${val(value)}`)
      .join('&');
  }

  return [
    ['IDEmisorFactura', input.issuerNif],
    ['NumSerieFactura', input.invoiceNo],
    ['FechaExpedicionFactura', input.invoiceDate],
    ['TipoFactura', input.invoiceType || 'F1'],
    ['CuotaTotal', formatMoney(input.taxTotal || 0)],
    ['ImporteTotal', formatMoney(input.invoiceTotal || 0)],
    ['Huella', input.previousHash || ''],
    ['FechaHoraHusoGenRegistro', input.generationTimestamp],
  ]
    .map(([key, value]) => `${key}=${val(value)}`)
    .join('&');
}

export function calculateVerifactuHash(
  input: Parameters<typeof buildVerifactuHashInput>[0],
): string {
  return createHash('sha256')
    .update(buildVerifactuHashInput(input), 'utf8')
    .digest('hex')
    .toUpperCase();
}

export function formatMoney(value: number | string): string {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }
  return numberValue.toFixed(2);
}
