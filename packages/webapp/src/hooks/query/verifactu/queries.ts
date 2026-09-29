import {
  createVerifactuAnulacion,
  createVerifactuSubsanacion,
  dispatchPendingVerifactu,
  fetchVerifactuConfig,
  fetchVerifactuConsole,
  fetchVerifactuRecord,
  fetchVerifactuRecords,
  fetchVerifactuStats,
  reconcileVerifactuInvoice,
  retryVerifactuRecord,
  updateVerifactuConfig,
  validateVerifactuCertificate,
  type CreateVerifactuAnulacionBody,
  type CreateVerifactuSubsanacionBody,
  type UpdateVerifactuConfigBody,
  type VerifactuConsoleQuery,
} from '@farocapital/sdk-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetcher } from '@/hooks/useRequest';

export const verifactuKeys = {
  all: ['VERIFACTU'] as const,
  config: () => ['VERIFACTU', 'CONFIG'] as const,
  stats: () => ['VERIFACTU', 'STATS'] as const,
  console: (query: VerifactuConsoleQuery) => ['VERIFACTU', 'CONSOLE', query] as const,
  records: (invoiceId?: number) => ['VERIFACTU', 'RECORDS', invoiceId] as const,
  record: (id?: number) => ['VERIFACTU', 'RECORD', id] as const,
};

const useInvalidateVerifactu = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: verifactuKeys.all });
};

export function useVerifactuConfig() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: verifactuKeys.config(),
    queryFn: () => fetchVerifactuConfig(fetcher),
  });
}

export function useUpdateVerifactuConfig() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({
    mutationFn: (body: UpdateVerifactuConfigBody) =>
      updateVerifactuConfig(fetcher, body),
    onSuccess: invalidate,
  });
}

export function useValidateVerifactuCertificate() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useMutation({ mutationFn: () => validateVerifactuCertificate(fetcher) });
}

export function useVerifactuStats() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({ queryKey: verifactuKeys.stats(), queryFn: () => fetchVerifactuStats(fetcher) });
}

export function useVerifactuConsole(query: VerifactuConsoleQuery) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: verifactuKeys.console(query),
    queryFn: () => fetchVerifactuConsole(fetcher, query),
  });
}

export function useVerifactuRecords(invoiceId?: number) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: verifactuKeys.records(invoiceId),
    queryFn: () => fetchVerifactuRecords(fetcher, invoiceId ? ({ invoiceId } as never) : undefined),
    enabled: Boolean(invoiceId),
  });
}

export function useVerifactuRecord(id?: number) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: verifactuKeys.record(id),
    queryFn: () => fetchVerifactuRecord(fetcher, id as number),
    enabled: Boolean(id),
  });
}

export function useDispatchVerifactu() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({ mutationFn: () => dispatchPendingVerifactu(fetcher), onSuccess: invalidate });
}

export function useRetryVerifactuRecord() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({ mutationFn: (id: number) => retryVerifactuRecord(fetcher, id), onSuccess: invalidate });
}

export function useReconcileVerifactuInvoice() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({
    mutationFn: (invoiceId: number) => reconcileVerifactuInvoice(fetcher, invoiceId),
    onSuccess: invalidate,
  });
}

export function useCreateVerifactuSubsanacion() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({
    mutationFn: ({ invoiceId, body }: { invoiceId: number; body: CreateVerifactuSubsanacionBody }) =>
      createVerifactuSubsanacion(fetcher, invoiceId, body),
    onSuccess: invalidate,
  });
}

export function useCreateVerifactuAnulacion() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const invalidate = useInvalidateVerifactu();
  return useMutation({
    mutationFn: ({ invoiceId, body }: { invoiceId: number; body?: CreateVerifactuAnulacionBody }) =>
      createVerifactuAnulacion(fetcher, invoiceId, body || {}),
    onSuccess: invalidate,
  });
}
