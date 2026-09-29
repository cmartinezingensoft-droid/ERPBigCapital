import type { ApiFetcher } from './fetch-utils';
import { rawRequest } from './fetch-utils';

export type ElectronicInvoiceFormat = 'facturae-3.2.2' | 'ubl-2.1';
export type ElectronicInvoiceProfile = 'face' | 'b2b-public' | 'b2b-private';
export type ElectronicInvoiceDeliveryStatus = 'submitted' | 'accepted' | 'rejected' | 'failed';
export type ElectronicInvoiceStatusEventType =
  | 'commercial_acceptance'
  | 'commercial_rejection'
  | 'partial_acceptance'
  | 'partial_rejection'
  | 'full_payment'
  | 'partial_payment'
  | 'assignment';

export interface ElectronicInvoiceDocument {
  id: number;
  saleInvoiceId: number;
  format: ElectronicInvoiceFormat;
  profile: ElectronicInvoiceProfile;
  semanticModel: string;
  specVersion: string;
  version: number;
  status: string;
  signatureStatus: string;
  payloadSha256?: string;
  signedPayloadSha256?: string;
  externalReference?: string;
  errorCode?: string;
  errorMessage?: string;
  generatedAt?: string;
  signedAt?: string;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  payload?: string;
  signedPayload?: string;
  responsePayload?: string;
  events?: ElectronicInvoiceStatusEvent[];
  invoiceNo?: string;
  invoiceDate?: string;
  customerName?: string;
  customerFiscalNumber?: string;
}

export interface ElectronicInvoiceStatusEvent {
  id: number;
  documentId: number;
  eventType: ElectronicInvoiceStatusEventType;
  eventDate: string;
  amount?: number;
  currencyCode?: string;
  assigneeTaxNumber?: string;
  assigneeName?: string;
  state?: string;
  externalReference?: string;
}

export interface ElectronicInvoiceConsoleQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  format?: ElectronicInvoiceFormat | '';
  profile?: ElectronicInvoiceProfile | '';
  search?: string;
}

export interface ElectronicInvoiceConsoleResponse {
  data: ElectronicInvoiceDocument[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
}


const mapEvent = (row: any): ElectronicInvoiceStatusEvent => ({
  ...row,
  id: Number(row.id),
  documentId: Number(row.documentId ?? row.document_id ?? 0),
  eventType: row.eventType ?? row.event_type,
  eventDate: row.eventDate ?? row.event_date,
  amount: row.amount == null ? undefined : Number(row.amount),
  currencyCode: row.currencyCode ?? row.currency_code,
  assigneeTaxNumber: row.assigneeTaxNumber ?? row.assignee_tax_number,
  assigneeName: row.assigneeName ?? row.assignee_name,
  externalReference: row.externalReference ?? row.external_reference,
});

const mapDocument = (row: any): ElectronicInvoiceDocument => ({
  ...row,
  id: Number(row.id),
  saleInvoiceId: Number(row.saleInvoiceId ?? row.sale_invoice_id ?? 0),
  semanticModel: row.semanticModel ?? row.semantic_model,
  specVersion: row.specVersion ?? row.spec_version,
  version: Number(row.version || 1),
  signatureStatus: row.signatureStatus ?? row.signature_status,
  payloadSha256: row.payloadSha256 ?? row.payload_sha256,
  signedPayload: row.signedPayload ?? row.signed_payload,
  signedPayloadSha256: row.signedPayloadSha256 ?? row.signed_payload_sha256,
  externalReference: row.externalReference ?? row.external_reference,
  responsePayload: row.responsePayload ?? row.response_payload,
  errorCode: row.errorCode ?? row.error_code,
  errorMessage: row.errorMessage ?? row.error_message,
  generatedAt: row.generatedAt ?? row.generated_at,
  signedAt: row.signedAt ?? row.signed_at,
  submittedAt: row.submittedAt ?? row.submitted_at,
  acceptedAt: row.acceptedAt ?? row.accepted_at,
  rejectedAt: row.rejectedAt ?? row.rejected_at,
  invoiceNo: row.invoiceNo ?? row.invoice_no,
  invoiceDate: row.invoiceDate ?? row.invoice_date,
  customerName: row.customerName ?? row.customer_name,
  customerFiscalNumber: row.customerFiscalNumber ?? row.customer_fiscal_number,
  events: Array.isArray(row.events) ? row.events.map(mapEvent) : undefined,
});
export interface ElectronicInvoiceCapabilities {
  semanticModel: string;
  formats: Record<string, unknown>;
  face: Record<string, unknown>;
  b2b: Record<string, unknown>;
}

export const fetchElectronicInvoiceCapabilities = (fetcher: ApiFetcher) =>
  rawRequest<ElectronicInvoiceCapabilities>(fetcher, 'GET', '/api/electronic-invoices/capabilities');

export const fetchElectronicInvoiceConsole = async (fetcher: ApiFetcher, query: ElectronicInvoiceConsoleQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const result = await rawRequest<any>(fetcher, 'GET', `/api/electronic-invoices/console?${params.toString()}`);
  return { ...result, data: (result.data || []).map(mapDocument) } as ElectronicInvoiceConsoleResponse;
};

export const fetchElectronicInvoiceDocuments = async (fetcher: ApiFetcher, invoiceId: number) =>
  (await rawRequest<any[]>(fetcher, 'GET', `/api/electronic-invoices/invoices/${invoiceId}/documents`)).map(mapDocument);

export const fetchElectronicInvoiceDocument = async (fetcher: ApiFetcher, id: number) =>
  mapDocument(await rawRequest<any>(fetcher, 'GET', `/api/electronic-invoices/documents/${id}`));

export const generateElectronicInvoice = (
  fetcher: ApiFetcher,
  invoiceId: number,
  body: { format: ElectronicInvoiceFormat; profile: ElectronicInvoiceProfile },
) => rawRequest<any>(fetcher, 'POST', `/api/electronic-invoices/invoices/${invoiceId}/generate`, body).then(mapDocument);

export const importSignedElectronicInvoice = (fetcher: ApiFetcher, id: number, signedPayload: string) =>
  rawRequest<any>(fetcher, 'POST', `/api/electronic-invoices/documents/${id}/signed`, { signedPayload }).then(mapDocument);

export const updateElectronicInvoiceDelivery = (
  fetcher: ApiFetcher,
  id: number,
  body: { status: ElectronicInvoiceDeliveryStatus; externalReference?: string; responsePayload?: string; errorCode?: string; errorMessage?: string },
) => rawRequest<any>(fetcher, 'POST', `/api/electronic-invoices/documents/${id}/delivery`, body).then(mapDocument);

export const createElectronicInvoiceStatusEvent = (
  fetcher: ApiFetcher,
  id: number,
  body: { eventType: ElectronicInvoiceStatusEventType; eventDate: string; amount?: number; currencyCode?: string; assigneeTaxNumber?: string; assigneeName?: string; payload?: string },
) => rawRequest<any>(fetcher, 'POST', `/api/electronic-invoices/documents/${id}/status-events`, body).then(mapEvent);
