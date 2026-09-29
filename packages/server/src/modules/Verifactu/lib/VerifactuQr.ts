import { formatMoney } from './VerifactuHash';
import { formatAeatDate } from './VerifactuTime';

export function buildVerifactuQrUrl(input: {
  endpoint: string;
  issuerNif: string;
  invoiceNo: string;
  invoiceDate: Date | string;
  invoiceTotal: number;
}): string {
  const params = new URLSearchParams({
    nif: input.issuerNif.trim().toUpperCase(),
    numserie: input.invoiceNo.trim().slice(0, 60),
    fecha: formatAeatDate(input.invoiceDate),
    importe: formatMoney(input.invoiceTotal),
  });
  return `${input.endpoint}?${params.toString()}`;
}
