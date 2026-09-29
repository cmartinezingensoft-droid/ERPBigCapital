import { TenantJobPayload } from '@/interfaces/Tenant';

export type VerifactuEvent = 'alta' | 'subsanacion' | 'anulacion';

export interface VerifactuBreakdown {
  impuesto: string;
  claveRegimen: string;
  calificacionOperacion?: 'S1' | 'S2' | 'N1' | 'N2';
  operacionExenta?: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';
  tipoImpositivo?: number;
  base: number;
  cuotaRepercutida?: number;
  tipoRecargoEquivalencia?: number;
  cuotaRecargoEquivalencia?: number;
}

export interface VerifactuPreviousRecord {
  id: number;
  issuerNif: string;
  invoiceNo: string;
  invoiceDate: string;
  hash: string;
}

export interface VerifactuSystemInfo {
  producerName: string;
  producerTaxNumber: string;
  systemName: string;
  systemId: string;
  version: string;
  installationNumber: string;
}

export interface VerifactuRecordData {
  event: VerifactuEvent;
  issuerNif: string;
  issuerName: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceType: string;
  customerName?: string;
  customerNif?: string;
  customerCountry?: string;
  customerAeatIdType?: string;
  description: string;
  breakdowns: VerifactuBreakdown[];
  taxTotal: number;
  invoiceTotal: number;
  generationTimestamp: string;
  previous?: VerifactuPreviousRecord;
  system: VerifactuSystemInfo;
  rejectionPrevious?: boolean;
}

export interface VerifactuJobPayload extends TenantJobPayload {
  requestedRecordId?: number;
}

export interface AeatSubmissionResult {
  ok: boolean;
  status: string;
  csv?: string;
  errorCode?: string;
  errorMessage?: string;
  waitSeconds?: number;
  responseXml: string;
  soapFault?: boolean;
}

export interface AeatQueryResult {
  found: boolean;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  queryResult?: string;
  responseXml: string;
  soapFault?: boolean;
}
