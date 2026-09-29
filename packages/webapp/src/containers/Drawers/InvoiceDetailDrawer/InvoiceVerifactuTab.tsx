import React from 'react';
import {
  Button,
  Callout,
  Card,
  HTMLTable,
  Intent,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { AppToaster } from '@/components';
import {
  useCreateVerifactuAnulacion,
  useCreateVerifactuSubsanacion,
  useReconcileVerifactuInvoice,
  useRetryVerifactuRecord,
  useVerifactuConfig,
  useVerifactuRecords,
} from '@/hooks/query/verifactu';
import { useInvoiceDetailDrawerContext } from './InvoiceDetailDrawerProvider';

const get = (row: any, camel: string, snake: string) => row?.[camel] ?? row?.[snake];
const statusIntent = (status?: string): Intent => {
  if (status === 'Correcto') return Intent.SUCCESS;
  if (status === 'AceptadoConErrores') return Intent.WARNING;
  if (status === 'Incorrecto' || status === 'transport_failed') return Intent.DANGER;
  return status === 'pending' ? Intent.PRIMARY : Intent.NONE;
};

export function InvoiceVerifactuTab() {
  const history = useHistory();
  const { invoiceId } = useInvoiceDetailDrawerContext();
  const { data, isLoading, refetch } = useVerifactuRecords(invoiceId);
  const { data: config } = useVerifactuConfig();
  const reconcile = useReconcileVerifactuInvoice();
  const retry = useRetryVerifactuRecord();
  const subsanacion = useCreateVerifactuSubsanacion();
  const anulacion = useCreateVerifactuAnulacion();
  const records = (Array.isArray(data) ? data : []) as any[];
  const latest = records[0];
  const latestStatus = get(latest, 'aeatStatus', 'aeat_status');
  const latestDispatch = get(latest, 'dispatchState', 'dispatch_state');

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      AppToaster.show({ intent: Intent.SUCCESS, message });
      await refetch();
    } catch (error) {
      AppToaster.show({
        intent: Intent.DANGER,
        message: error instanceof Error ? error.message : 'No se pudo completar la operación VERI*FACTU.',
      });
    }
  };

  if (isLoading) return <Center><Spinner /></Center>;

  if (!records.length) {
    return (
      <Root>
        <Callout
          intent={config?.effectiveEnabled ? Intent.PRIMARY : Intent.WARNING}
          title="Sin registro VERI*FACTU"
        >
          {config?.effectiveEnabled
            ? 'Esta factura todavía no tiene un registro fiscal VERI*FACTU. El alta se genera cuando la factura queda emitida/entregada.'
            : config?.siiEnabled
              ? 'La empresa está configurada para SII, por lo que FaroCapital bloquea VERI*FACTU.'
              : 'VERI*FACTU no está activo para esta empresa o en el servidor.'}
        </Callout>
        <Button icon="cog" onClick={() => history.push('/preferences/verifactu')}>Abrir configuración fiscal</Button>
      </Root>
    );
  }

  return (
    <Root>
      <SummaryCard>
        <Summary>
          <div><small>Último estado AEAT</small><strong><Tag intent={statusIntent(latestStatus)}>{latestStatus || '—'}</Tag></strong></div>
          <div><small>Cola</small><strong>{latestDispatch || '—'}</strong></div>
          <div><small>CSV</small><strong>{get(latest, 'aeatCsv', 'aeat_csv') || '—'}</strong></div>
          <div><small>Intentos totales</small><strong>{get(latest, 'totalAttempts', 'total_attempts') ?? get(latest, 'dispatchAttempts', 'dispatch_attempts') ?? 0}</strong></div>
        </Summary>
        {get(latest, 'aeatErrorMessage', 'aeat_error_message') && (
          <Callout intent={Intent.DANGER} title={get(latest, 'aeatErrorCode', 'aeat_error_code') || 'Error AEAT'}>
            {get(latest, 'aeatErrorMessage', 'aeat_error_message')}
          </Callout>
        )}
        <Actions>
          <Button
            small
            icon="search"
            disabled={!config?.effectiveEnabled || get(latest, 'event', 'event') === 'anulacion'}
            loading={reconcile.isPending}
            onClick={() => run(() => reconcile.mutateAsync(invoiceId as number), 'Estado consultado en AEAT.')}
          >
            Consultar AEAT
          </Button>
          {latestDispatch === 'failed' && latestStatus !== 'Incorrecto' && (
            <Button small icon="repeat" disabled={!config?.effectiveEnabled} loading={retry.isPending} onClick={() => run(() => retry.mutateAsync(Number(latest.id)), 'Registro devuelto a la cola.')}>Reintentar</Button>
          )}
          {latestStatus === 'Incorrecto' && get(latest, 'event', 'event') !== 'anulacion' && (
            <Button
              small
              intent={Intent.WARNING}
              disabled={!config?.effectiveEnabled}
              loading={subsanacion.isPending}
              onClick={() => {
                if (!window.confirm('Se creará un nuevo registro inmutable de subsanación. ¿Continuar?')) return;
                run(
                  () => subsanacion.mutateAsync({
                    invoiceId: invoiceId as number,
                    body: { rejectionPrevious: true, refreshTaxClassification: false } as never,
                  }),
                  'Subsanación creada.',
                );
              }}
            >
              Subsanar
            </Button>
          )}
          {['Correcto', 'AceptadoConErrores'].includes(latestStatus) && get(latest, 'event', 'event') !== 'anulacion' && (
            <Button
              small
              intent={Intent.DANGER}
              disabled={!config?.effectiveEnabled}
              loading={anulacion.isPending}
              onClick={() => {
                if (!window.confirm('Se creará un registro fiscal de anulación. ¿Continuar?')) return;
                run(() => anulacion.mutateAsync({ invoiceId: invoiceId as number, body: {} }), 'Anulación creada.');
              }}
            >
              Anular
            </Button>
          )}
          <Button small icon="application" onClick={() => history.push('/verifactu')}>Abrir consola</Button>
        </Actions>
      </SummaryCard>

      <TableWrap>
        <HTMLTable striped style={{ width: '100%' }}>
          <thead><tr><th>Registro</th><th>Evento</th><th>Versión</th><th>Estado AEAT</th><th>Cola</th><th>CSV</th><th>Hash</th></tr></thead>
          <tbody>
            {records.map((row) => {
              const status = get(row, 'aeatStatus', 'aeat_status');
              return (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{get(row, 'event', 'event')}</td>
                  <td>{get(row, 'recordVersion', 'record_version') || 1}</td>
                  <td><Tag intent={statusIntent(status)}>{status || '—'}</Tag></td>
                  <td>{get(row, 'dispatchState', 'dispatch_state') || '—'}</td>
                  <td>{get(row, 'aeatCsv', 'aeat_csv') || '—'}</td>
                  <td><Hash>{get(row, 'hash', 'hash')}</Hash></td>
                </tr>
              );
            })}
          </tbody>
        </HTMLTable>
      </TableWrap>
    </Root>
  );
}

const Root = styled.div`padding: 18px; display: flex; flex-direction: column; gap: 14px;`;
const Center = styled.div`padding: 35px; display: flex; justify-content: center;`;
const SummaryCard = styled(Card)`display: flex; flex-direction: column; gap: 14px;`;
const Summary = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; small { display:block; opacity:.7; margin-bottom:5px; } strong { overflow-wrap:anywhere; }`;
const Actions = styled.div`display: flex; gap: 7px; flex-wrap: wrap;`;
const TableWrap = styled.div`overflow: auto;`;
const Hash = styled.code`font-size: 10px; word-break: break-all;`;
