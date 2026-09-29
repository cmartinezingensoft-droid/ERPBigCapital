import {
  createElectronicInvoiceStatusEvent,
  fetchElectronicInvoiceCapabilities,
  fetchElectronicInvoiceConsole,
  fetchElectronicInvoiceDocument,
  fetchElectronicInvoiceDocuments,
  generateElectronicInvoice,
  importSignedElectronicInvoice,
  updateElectronicInvoiceDelivery,
  type ElectronicInvoiceConsoleQuery,
  type ElectronicInvoiceDeliveryStatus,
  type ElectronicInvoiceFormat,
  type ElectronicInvoiceProfile,
  type ElectronicInvoiceStatusEventType,
} from '@farocapital/sdk-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetcher } from '@/hooks/useRequest';

export const electronicInvoiceKeys = {
  all: ['ELECTRONIC_INVOICING'] as const,
  capabilities: () => ['ELECTRONIC_INVOICING', 'CAPABILITIES'] as const,
  console: (query: ElectronicInvoiceConsoleQuery) => ['ELECTRONIC_INVOICING', 'CONSOLE', query] as const,
  documents: (invoiceId?: number) => ['ELECTRONIC_INVOICING', 'DOCUMENTS', invoiceId] as const,
  document: (id?: number) => ['ELECTRONIC_INVOICING', 'DOCUMENT', id] as const,
};

const useInvalidate = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: electronicInvoiceKeys.all });
};

export function useElectronicInvoiceCapabilities() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({ queryKey: electronicInvoiceKeys.capabilities(), queryFn: () => fetchElectronicInvoiceCapabilities(fetcher) });
}

export function useElectronicInvoiceConsole(query: ElectronicInvoiceConsoleQuery) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({ queryKey: electronicInvoiceKeys.console(query), queryFn: () => fetchElectronicInvoiceConsole(fetcher, query) });
}

export function useElectronicInvoiceDocuments(invoiceId?: number) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({ queryKey: electronicInvoiceKeys.documents(invoiceId), queryFn: () => fetchElectronicInvoiceDocuments(fetcher, invoiceId as number), enabled: Boolean(invoiceId) });
}

export function useElectronicInvoiceDocument(id?: number) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({ queryKey: electronicInvoiceKeys.document(id), queryFn: () => fetchElectronicInvoiceDocument(fetcher, id as number), enabled: Boolean(id) });
}

export function useGenerateElectronicInvoice() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ invoiceId, format, profile }: { invoiceId: number; format: ElectronicInvoiceFormat; profile: ElectronicInvoiceProfile }) => generateElectronicInvoice(fetcher, invoiceId, { format, profile }),
    onSuccess: invalidate,
  });
}

export function useImportSignedElectronicInvoice() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, signedPayload }: { id: number; signedPayload: string }) => importSignedElectronicInvoice(fetcher, id, signedPayload), onSuccess: invalidate });
}

export function useUpdateElectronicInvoiceDelivery() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, status, externalReference }: { id: number; status: ElectronicInvoiceDeliveryStatus; externalReference?: string }) => updateElectronicInvoiceDelivery(fetcher, id, { status, externalReference }), onSuccess: invalidate });
}

export function useCreateElectronicInvoiceStatusEvent() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, eventType, amount, currencyCode }: { id: number; eventType: ElectronicInvoiceStatusEventType; amount?: number; currencyCode?: string }) => createElectronicInvoiceStatusEvent(fetcher, id, { eventType, eventFecha: new Date().toISOString(), amount, currencyCode }), onSuccess: invalidate });
}
