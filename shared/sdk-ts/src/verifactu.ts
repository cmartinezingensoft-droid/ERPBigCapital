import type { ApiFetcher } from './fetch-utils';
import { rawRequest } from './fetch-utils';
import { paths } from './schema';
import { OpForPath, OpQueryParams, OpRequestBody, OpResponseBody } from './utils';

export const VERIFACTU_ROUTES = {
  RECORDS: '/api/verifactu/records',
  DISPATCH: '/api/verifactu/dispatch',
  SUBSANACION: '/api/verifactu/invoices/{id}/subsanacion',
  RECONCILE: '/api/verifactu/invoices/{id}/reconcile',
  ANULACION: '/api/verifactu/invoices/{id}/anulacion',
} as const satisfies Record<string, keyof paths>;

export type VerifactuRecordsResponse = OpResponseBody<
  OpForPath<typeof VERIFACTU_ROUTES.RECORDS, 'get'>
>;
export type VerifactuRecordsQuery = OpQueryParams<
  OpForPath<typeof VERIFACTU_ROUTES.RECORDS, 'get'>
>;
export type CreateVerifactuSubsanacionBody = OpRequestBody<
  OpForPath<typeof VERIFACTU_ROUTES.SUBSANACION, 'post'>
>;
export type CreateVerifactuAnulacionBody = OpRequestBody<
  OpForPath<typeof VERIFACTU_ROUTES.ANULACION, 'post'>
>;
export type VerifactuRecord = OpResponseBody<
  OpForPath<typeof VERIFACTU_ROUTES.SUBSANACION, 'post'>
>;

export interface VerifactuConfig {
  enabled: boolean;
  serverEnabled: boolean;
  siiEnabled: boolean;
  effectiveEnabled: boolean;
  environment: 'test' | 'production';
  producerName: string;
  producerTaxNumber: string;
  systemName: string;
  systemId: string;
  systemVersion: string;
  installationNumber: string;
  certificateConfigured: boolean;
  certificateFileExists: boolean;
  certificateFilename: string;
  certificatePassphraseConfigured: boolean;
  endpointHost: string;
  warnings: string[];
  ready: boolean;
}

export interface UpdateVerifactuConfigBody {
  enabled?: boolean;
  environment?: 'test' | 'production';
  siiEnabled?: boolean;
  producerName?: string;
  producerTaxNumber?: string;
  systemName?: string;
  systemId?: string;
  systemVersion?: string;
  installationNumber?: string;
}

export interface VerifactuCertificateValidation {
  ok: boolean;
  configured: boolean;
  filename?: string;
  message?: string;
  error?: string;
}

export interface VerifactuStats {
  total: number;
  accepted: number;
  rejected: number;
  technicalFailures: number;
  pending: number;
  statuses: Record<string, number>;
  dispatch: Record<string, number>;
}

export interface VerifactuConsoleQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  dispatchState?: string;
  event?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface VerifactuConsoleRow {
  id: number;
  saleInvoiceId: number;
  event: 'alta' | 'subsanacion' | 'anulacion';
  recordVersion: number;
  invoiceType: string;
  issuerNif: string;
  invoiceNo: string;
  invoiceDate: string;
  taxTotal: number;
  invoiceTotal: number;
  previousHash?: string | null;
  hash: string;
  qrUrl?: string | null;
  aeatStatus: string;
  aeatCsv?: string | null;
  aeatErrorCode?: string | null;
  aeatErrorMessage?: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
  lastReconciledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dispatchState?: string | null;
  dispatchAttempts?: number | null;
  totalAttempts?: number | null;
  manualRetryCount?: number | null;
  lastManualRetryAt?: string | null;
  nextAttemptAt?: string | null;
  dispatchError?: string | null;
  customerId?: number | null;
  payloadJson?: string | Record<string, unknown>;
  payloadXml?: string;
  lastResponseXml?: string | null;
  aeatQueryResponseXml?: string | null;
  tiempoEsperaEnvio?: number | null;
}

export interface VerifactuConsoleResponse {
  data: VerifactuConsoleRow[];
  pagination: { page: number; pageSize: number; total: number };
}

const recordFromApi = (row: Record<string, any>): VerifactuConsoleRow => ({
  ...row,
  id: Number(row.id),
  event: (row.event || 'alta') as VerifactuConsoleRow['event'],
  hash: String(row.hash || ''),
  saleInvoiceId: Number(row.saleInvoiceId ?? row.sale_invoice_id ?? 0),
  recordVersion: Number(row.recordVersion ?? row.record_version ?? 1),
  invoiceType: row.invoiceType ?? row.invoice_type ?? 'F1',
  issuerNif: row.issuerNif ?? row.issuer_nif ?? '',
  invoiceNo: row.invoiceNo ?? row.invoice_no ?? '',
  invoiceDate: row.invoiceDate ?? row.invoice_date ?? '',
  taxTotal: Number(row.taxTotal ?? row.tax_total ?? 0),
  invoiceTotal: Number(row.invoiceTotal ?? row.invoice_total ?? 0),
  previousHash: row.previousHash ?? row.previous_hash,
  qrUrl: row.qrUrl ?? row.qr_url,
  aeatStatus: row.aeatStatus ?? row.aeat_status ?? 'pending',
  aeatCsv: row.aeatCsv ?? row.aeat_csv,
  aeatErrorCode: row.aeatErrorCode ?? row.aeat_error_code,
  aeatErrorMessage: row.aeatErrorMessage ?? row.aeat_error_message,
  sentAt: row.sentAt ?? row.sent_at,
  acceptedAt: row.acceptedAt ?? row.accepted_at,
  lastReconciledAt: row.lastReconciledAt ?? row.last_reconciled_at,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
  dispatchState: row.dispatchState ?? row.dispatch_state,
  dispatchAttempts: Number(row.dispatchAttempts ?? row.dispatch_attempts ?? 0),
  totalAttempts: Number(row.totalAttempts ?? row.total_attempts ?? row.dispatchAttempts ?? row.dispatch_attempts ?? 0),
  manualRetryCount: Number(row.manualRetryCount ?? row.manual_retry_count ?? 0),
  lastManualRetryAt: row.lastManualRetryAt ?? row.last_manual_retry_at,
  nextAttemptAt: row.nextAttemptAt ?? row.next_attempt_at,
  dispatchError: row.dispatchError ?? row.dispatch_error,
  customerId: row.customerId ?? row.customer_id,
  payloadJson: row.payloadJson ?? row.payload_json,
  payloadXml: row.payloadXml ?? row.payload_xml,
  lastResponseXml: row.lastResponseXml ?? row.last_response_xml,
  aeatQueryResponseXml: row.aeatQueryResponseXml ?? row.aeat_query_response_xml,
  tiempoEsperaEnvio: row.tiempoEsperaEnvio ?? row.tiempo_espera_envio,
});

export async function fetchVerifactuRecords(
  fetcher: ApiFetcher,
  query?: VerifactuRecordsQuery,
): Promise<VerifactuRecordsResponse> {
  const get = fetcher.path(VERIFACTU_ROUTES.RECORDS).method('get').create();
  const { data } = await get(query ?? {});
  return data;
}

export async function createVerifactuSubsanacion(
  fetcher: ApiFetcher,
  invoiceId: number,
  body: CreateVerifactuSubsanacionBody,
): Promise<VerifactuRecord> {
  const post = fetcher.path(VERIFACTU_ROUTES.SUBSANACION).method('post').create();
  const { data } = await post({ id: invoiceId, ...body } as never);
  return data;
}

export async function createVerifactuAnulacion(
  fetcher: ApiFetcher,
  invoiceId: number,
  body: CreateVerifactuAnulacionBody = {},
): Promise<VerifactuRecord> {
  const post = fetcher.path(VERIFACTU_ROUTES.ANULACION).method('post').create();
  const { data } = await post({ id: invoiceId, ...body } as never);
  return data;
}

export async function reconcileVerifactuInvoice(
  fetcher: ApiFetcher,
  invoiceId: number,
): Promise<Record<string, unknown>> {
  const post = fetcher.path(VERIFACTU_ROUTES.RECONCILE).method('post').create();
  const { data } = await post({ id: invoiceId } as never);
  return data as Record<string, unknown>;
}

export async function dispatchPendingVerifactu(
  fetcher: ApiFetcher,
): Promise<Record<string, unknown>> {
  const post = fetcher.path(VERIFACTU_ROUTES.DISPATCH).method('post').create();
  const { data } = await post({} as never);
  return data as Record<string, unknown>;
}

export async function fetchVerifactuConfig(
  fetcher: ApiFetcher,
): Promise<VerifactuConfig> {
  return rawRequest<VerifactuConfig>(fetcher, 'GET', '/api/verifactu/config');
}

export async function updateVerifactuConfig(
  fetcher: ApiFetcher,
  body: UpdateVerifactuConfigBody,
): Promise<VerifactuConfig> {
  return rawRequest<VerifactuConfig>(
    fetcher,
    'PUT',
    '/api/verifactu/config',
    body as Record<string, unknown>,
  );
}

export async function validateVerifactuCertificate(
  fetcher: ApiFetcher,
): Promise<VerifactuCertificateValidation> {
  return rawRequest<VerifactuCertificateValidation>(
    fetcher,
    'POST',
    '/api/verifactu/config/validate-certificate',
    {},
  );
}

export async function fetchVerifactuStats(
  fetcher: ApiFetcher,
): Promise<VerifactuStats> {
  return rawRequest<VerifactuStats>(fetcher, 'GET', '/api/verifactu/stats');
}

export async function fetchVerifactuConsole(
  fetcher: ApiFetcher,
  query: VerifactuConsoleQuery = {},
): Promise<VerifactuConsoleResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const result = await rawRequest<any>(
    fetcher,
    'GET',
    `/api/verifactu/console${suffix}`,
  );
  return {
    data: Array.isArray(result?.data) ? result.data.map(recordFromApi) : [],
    pagination: {
      page: Number(result?.pagination?.page || 1),
      pageSize: Number(result?.pagination?.pageSize ?? result?.pagination?.page_size ?? 25),
      total: Number(result?.pagination?.total || 0),
    },
  };
}

export async function fetchVerifactuRecord(
  fetcher: ApiFetcher,
  id: number,
): Promise<VerifactuConsoleRow> {
  const result = await rawRequest<Record<string, any>>(
    fetcher,
    'GET',
    `/api/verifactu/records/${id}`,
  );
  return recordFromApi(result);
}

export async function retryVerifactuRecord(
  fetcher: ApiFetcher,
  id: number,
): Promise<VerifactuConsoleRow> {
  const result = await rawRequest<Record<string, any>>(
    fetcher,
    'POST',
    `/api/verifactu/records/${id}/retry`,
    {},
  );
  return recordFromApi(result);
}
