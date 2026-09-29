import type { ApiFetcher } from './fetch-utils';
import { rawRequest } from './fetch-utils';

export interface SiiConfig {
  enabled: boolean;
  environment: 'test' | 'production';
  certificateConfigured: boolean;
  certificateExists: boolean;
  certificateFilename?: string;
  passphraseConfigured: boolean;
  configuredEndpoints: string[];
  endpoints?: { issued?: string; received?: string; issuedPayment?: string; receivedPayment?: string };
  generationReady: boolean;
  transportReady: boolean;
  warnings: string[];
  schemaVersion: string;
}
export interface SiiRecord {
  id: number; recordKind?: string; record_kind?: string; sourceType?: string; source_type?: string;
  sourceId?: number; source_id?: number; sourceNumber?: string; source_number?: string;
  periodYear?: string; period_year?: string; periodMonth?: string; period_month?: string;
  counterpartyName?: string; counterparty_name?: string; counterpartyTaxNumber?: string; counterparty_tax_number?: string;
  status: string; payloadXml?: string; payload_xml?: string; payloadSha256?: string; payload_sha256?: string;
  responseXml?: string; response_xml?: string; aeatCsv?: string; aeat_csv?: string;
  errorCode?: string; error_code?: string; errorMessage?: string; error_message?: string; attempts?: number;
}
export interface SiiConsoleQuery { page?: number; pageSize?: number; status?: string; kind?: string; search?: string }
const params = (query: SiiConsoleQuery) => {
  const p = new URLSearchParams(); Object.entries(query).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const value=p.toString(); return value ? `?${value}` : '';
};
export const fetchSiiConfig = (fetcher: ApiFetcher) => rawRequest<SiiConfig>(fetcher, 'GET', '/api/sii/config');
export const updateSiiConfig = (fetcher: ApiFetcher, body: Partial<{ enabled: boolean; environment: 'test'|'production'; endpointIssued: string; endpointReceived: string; endpointIssuedPayment: string; endpointReceivedPayment: string }>) => rawRequest<SiiConfig>(fetcher, 'PUT', '/api/sii/config', body);
export const syncSii = (fetcher: ApiFetcher, body: { fromDate?: string; toDate?: string }) => rawRequest<any>(fetcher, 'POST', '/api/sii/sync', body);
export const fetchSiiRecords = (fetcher: ApiFetcher, query: SiiConsoleQuery = {}) => rawRequest<any>(fetcher, 'GET', `/api/sii/records${params(query)}`);
export const fetchSiiRecord = (fetcher: ApiFetcher, id: number) => rawRequest<SiiRecord>(fetcher, 'GET', `/api/sii/records/${id}`);
export const submitSiiRecord = (fetcher: ApiFetcher, id: number) => rawRequest<SiiRecord>(fetcher, 'POST', `/api/sii/records/${id}/submit`);
export const retrySiiRecord = (fetcher: ApiFetcher, id: number) => rawRequest<SiiRecord>(fetcher, 'POST', `/api/sii/records/${id}/retry`);
