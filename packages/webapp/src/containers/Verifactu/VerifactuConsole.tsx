import React from 'react';
import {
  Button,
  Callout,
  Card,
  Dialog,
  FormGroup,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import type { VerifactuConsoleQuery, VerifactuConsoleRow } from '@farocapital/sdk-ts';
import { AppToaster, DashboardPageContent } from '@/components';
import {
  useCreateVerifactuAnulacion,
  useCreateVerifactuSubsanacion,
  useDispatchVerifactu,
  useReconcileVerifactuInvoice,
  useRetryVerifactuRecord,
  useVerifactuConfig,
  useVerifactuConsole,
  useVerifactuRecord,
  useVerifactuStats,
} from '@/hooks/query/verifactu';

const money = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    Number(value || 0),
  );

const date = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('es-ES');
};

const statusIntent = (status?: string | null): Intent => {
  if (status === 'Correcto') return Intent.SUCCESS;
  if (status === 'AceptadoConErrores') return Intent.WARNING;
  if (status === 'Incorrecto' || status === 'transport_failed') return Intent.DANGER;
  if (status === 'pending') return Intent.PRIMARY;
  return Intent.NONE;
};

const eventLabel = (event: string) =>
  ({ alta: 'Alta', subsanacion: 'Subsanación', anulacion: 'Anulación' } as Record<string, string>)[event] || event;

function RecordDetailDialog({
  recordId,
  onClose,
}: {
  recordId?: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useVerifactuRecord(recordId);
  const payloadJson = React.useMemo(() => {
    if (!data?.payloadJson) return '';
    if (typeof data.payloadJson === 'string') return data.payloadJson;
    return JSON.stringify(data.payloadJson, null, 2);
  }, [data?.payloadJson]);

  return (
    <Dialog
      isOpen={Boolean(recordId)}
      onClose={onClose}
      title={recordId ? `Registro VERI*FACTU #${recordId}` : 'Registro VERI*FACTU'}
      style={{ width: 'min(1080px, 94vw)' }}
    >
      <div className="bp4-dialog-body">
        {isLoading || !data ? (
          <Spinner />
        ) : (
          <DetailGrid>
            <strong>Factura</strong><span>{data.invoiceNo}</span>
            <strong>Evento / versión</strong><span>{eventLabel(data.event)} / {data.recordVersion}</span>
            <strong>Estado AEAT</strong><span><Tag intent={statusIntent(data.aeatStatus)}>{data.aeatStatus}</Tag></span>
            <strong>Estado de cola</strong><span>{data.dispatchState || '—'} · {data.totalAttempts ?? data.dispatchAttempts ?? 0} intentos totales · {data.manualRetryCount || 0} reintentos manuales</span>
            <strong>CSV</strong><span>{data.aeatCsv || '—'}</span>
            <strong>Hash</strong><Code>{data.hash}</Code>
            <strong>Hash anterior</strong><Code>{data.previousHash || '—'}</Code>
            <strong>Error AEAT</strong><span>{[data.aeatErrorCode, data.aeatErrorMessage].filter(Boolean).join(' · ') || '—'}</span>
            <strong>Error transporte</strong><span>{data.dispatchError || '—'}</span>
            <strong>Enviado</strong><span>{date(data.sentAt)}</span>
            <strong>Conciliado</strong><span>{date(data.lastReconciledAt)}</span>
            <strong>Payload fiscal JSON</strong><Pre>{payloadJson || '—'}</Pre>
            <strong>XML enviado</strong><Pre>{data.payloadXml || '—'}</Pre>
            <strong>Respuesta AEAT</strong><Pre>{data.lastResponseXml || '—'}</Pre>
            <strong>Consulta AEAT</strong><Pre>{data.aeatQueryResponseXml || '—'}</Pre>
          </DetailGrid>
        )}
      </div>
      <div className="bp4-dialog-footer">
        <div className="bp4-dialog-footer-actions">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Dialog>
  );
}

export function VerifactuConsole() {
  const history = useHistory();
  const [query, setQuery] = React.useState<VerifactuConsoleQuery>({ page: 1, pageSize: 25 });
  const [detailId, setDetailId] = React.useState<number>();
  const { data: config, isLoading: configLoading } = useVerifactuConfig();
  const { data: stats } = useVerifactuStats();
  const { data, isLoading, refetch } = useVerifactuConsole(query);
  const dispatch = useDispatchVerifactu();
  const retry = useRetryVerifactuRecord();
  const reconcile = useReconcileVerifactuInvoice();
  const subsanacion = useCreateVerifactuSubsanacion();
  const anulacion = useCreateVerifactuAnulacion();

  const execute = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      AppToaster.show({ message: success, intent: Intent.SUCCESS });
      await refetch();
    } catch (error) {
      AppToaster.show({
        message: error instanceof Error ? error.message : 'No se pudo completar la operación.',
        intent: Intent.DANGER,
      });
    }
  };

  const handleSubsanacion = (row: VerifactuConsoleRow) => {
    if (!window.confirm(`Crear un nuevo registro de subsanación para la factura ${row.invoiceNo}?`)) return;
    execute(
      () => subsanacion.mutateAsync({
        invoiceId: row.saleInvoiceId,
        body: { rejectionPrevious: row.aeatStatus === 'Incorrecto', refreshTaxClassification: false } as never,
      }),
      'Subsanación creada y encadenada.',
    );
  };

  const handleAnulacion = (row: VerifactuConsoleRow) => {
    if (!window.confirm(`Crear un registro de anulación para la factura ${row.invoiceNo}?`)) return;
    execute(
      () => anulacion.mutateAsync({ invoiceId: row.saleInvoiceId, body: {} }),
      'Anulación creada y encadenada.',
    );
  };

  const page = data?.pagination.page || 1;
  const total = data?.pagination.total || 0;
  const pageSize = data?.pagination.pageSize || 25;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <DashboardPageContent>
        <Page>
          <Header>
            <div>
              <h2>Consola VERI*FACTU</h2>
              <p>Seguimiento de registros inmutables, cola de envío y respuestas de la AEAT.</p>
            </div>
            <Actions>
              <Button icon="cog" onClick={() => history.push('/preferences/verifactu')}>Configuración</Button>
              <Button icon="refresh" onClick={() => refetch()}>Actualizar</Button>
              <Button
                intent={Intent.PRIMARY}
                icon="send-message"
                loading={dispatch.isPending}
                disabled={!config?.effectiveEnabled}
                onClick={() => execute(() => dispatch.mutateAsync(), 'Cola VERI*FACTU procesada.')}
              >
                Procesar cola
              </Button>
            </Actions>
          </Header>

          {configLoading ? (
            <Spinner size={24} />
          ) : (
            <Callout
              intent={config?.ready ? Intent.SUCCESS : config?.siiEnabled ? Intent.WARNING : Intent.DANGER}
              title={config?.ready ? 'VERI*FACTU operativo' : config?.siiEnabled ? 'VERI*FACTU bloqueado por SII' : 'VERI*FACTU requiere configuración'}
            >
              {config?.serverEnabled ? 'Servidor habilitado' : 'El interruptor VERIFACTU_ENABLED del servidor está desactivado'} · entorno{' '}
              <strong>{config?.environment === 'production' ? 'Producción' : 'Pruebas'}</strong> · certificado{' '}
              <strong>{config?.certificateConfigured ? (config.certificateFileExists ? config.certificateFilename || 'configurado' : 'ruta no accesible') : 'no configurado'}</strong>.
              {config?.warnings?.length ? ` Avisos: ${config.warnings.join(', ')}.` : ''}
            </Callout>
          )}

          <Stats>
            <StatCard><small>Total</small><strong>{stats?.total ?? 0}</strong></StatCard>
            <StatCard><small>Aceptados</small><strong>{stats?.accepted ?? 0}</strong></StatCard>
            <StatCard><small>Pendientes</small><strong>{stats?.pending ?? 0}</strong></StatCard>
            <StatCard><small>Rechazados</small><strong>{stats?.rejected ?? 0}</strong></StatCard>
            <StatCard><small>Fallos técnicos</small><strong>{stats?.technicalFailures ?? 0}</strong></StatCard>
          </Stats>

          <Card>
            <Filters>
              <FormGroup label="Buscar">
                <InputGroup
                  placeholder="Factura, NIF, CSV o error"
                  value={query.search || ''}
                  onChange={(e) => setQuery((q) => ({ ...q, page: 1, search: e.target.value }))}
                />
              </FormGroup>
              <FormGroup label="Estado AEAT">
                <HTMLSelect
                  value={query.status || ''}
                  onChange={(e) => setQuery((q) => ({ ...q, page: 1, status: e.target.value || undefined }))}
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="Correcto">Correcto</option>
                  <option value="AceptadoConErrores">Aceptado con errores</option>
                  <option value="Incorrecto">Incorrecto</option>
                  <option value="transport_failed">Fallo técnico</option>
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="Evento">
                <HTMLSelect
                  value={query.event || ''}
                  onChange={(e) => setQuery((q) => ({ ...q, page: 1, event: e.target.value || undefined }))}
                >
                  <option value="">Todos</option>
                  <option value="alta">Alta</option>
                  <option value="subsanacion">Subsanación</option>
                  <option value="anulacion">Anulación</option>
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="Cola">
                <HTMLSelect
                  value={query.dispatchState || ''}
                  onChange={(e) => setQuery((q) => ({ ...q, page: 1, dispatchState: e.target.value || undefined }))}
                >
                  <option value="">Todas</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="retry">Reintento</option>
                  <option value="completed">Completado</option>
                  <option value="failed">Fallido</option>
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="Desde"><InputGroup type="date" value={query.fromDate || ''} onChange={(e) => setQuery((q) => ({ ...q, page: 1, fromFecha: e.target.value || undefined }))} /></FormGroup>
              <FormGroup label="Hasta"><InputGroup type="date" value={query.toDate || ''} onChange={(e) => setQuery((q) => ({ ...q, page: 1, toFecha: e.target.value || undefined }))} /></FormGroup>
            </Filters>

            <TableWrap>
              {isLoading ? <Spinner /> : (
                <HTMLTable striped interactive style={{ width: '100%' }}>
                  <thead>
                    <tr><th>Factura</th><th>Fecha</th><th>Evento</th><th>Total</th><th>AEAT</th><th>Cola</th><th>CSV / error</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {(data?.data || []).map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.invoiceNo}</strong><br/><small>#{row.id} · v{row.recordVersion}</small></td>
                        <td>{date(row.invoiceDate)}</td>
                        <td>{eventLabel(row.event)}</td>
                        <td>{money(row.invoiceTotal)}</td>
                        <td><Tag intent={statusIntent(row.aeatStatus)}>{row.aeatStatus || '—'}</Tag></td>
                        <td>{row.dispatchState || '—'}<br/><small>{row.totalAttempts ?? row.dispatchAttempts ?? 0} intentos · {row.manualRetryCount || 0} manuales</small></td>
                        <td title={row.aeatErrorMessage || row.dispatchError || ''}>{row.aeatCsv || row.aeatErrorCode || row.aeatErrorMessage || row.dispatchError || '—'}</td>
                        <td>
                          <RowActions>
                            <Button small icon="eye-open" onClick={() => setDetailId(row.id)}>Detalle</Button>
                            {row.event !== 'anulacion' && (
                              <Button small icon="search" loading={reconcile.isPending} disabled={!config?.effectiveEnabled} onClick={() => execute(() => reconcile.mutateAsync(row.saleInvoiceId), 'Consulta AEAT actualizada.')}>AEAT</Button>
                            )}
                            {row.dispatchState === 'failed' && row.aeatStatus !== 'Incorrecto' && (
                              <Button small icon="repeat" loading={retry.isPending} disabled={!config?.effectiveEnabled} onClick={() => execute(() => retry.mutateAsync(row.id), 'Registro reenviado a la cola.')}>Reintentar</Button>
                            )}
                            {row.event !== 'anulacion' && row.aeatStatus === 'Incorrecto' && (
                              <Button small intent={Intent.WARNING} onClick={() => handleSubsanacion(row)} disabled={!config?.effectiveEnabled}>Subsanar</Button>
                            )}
                            {row.event !== 'anulacion' && ['Correcto', 'AceptadoConErrores'].includes(row.aeatStatus) && (
                              <Button small intent={Intent.DANGER} onClick={() => handleAnulacion(row)} disabled={!config?.effectiveEnabled}>Anular</Button>
                            )}
                          </RowActions>
                        </td>
                      </tr>
                    ))}
                    {!data?.data?.length && <tr><td colSpan={8}>No hay registros para los filtros seleccionados.</td></tr>}
                  </tbody>
                </HTMLTable>
              )}
            </TableWrap>

            <Pagination>
              <span>{total} registros · página {page} de {lastPage}</span>
              <div>
                <Button small disabled={page <= 1} onClick={() => setQuery((q) => ({ ...q, page: page - 1 }))}>Anterior</Button>{' '}
                <Button small disabled={page >= lastPage} onClick={() => setQuery((q) => ({ ...q, page: page + 1 }))}>Siguiente</Button>
              </div>
            </Pagination>
          </Card>
        </Page>
      </DashboardPageContent>
      <RecordDetailDialog recordId={detailId} onClose={() => setDetailId(undefined)} />
    </>
  );
}

const Page = styled.div`display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px;`;
const Header = styled.div`display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; h2 { margin: 0 0 4px; } p { margin: 0; opacity: .75; }`;
const Actions = styled.div`display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;`;
const Stats = styled.div`display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }`;
const StatCard = styled(Card)`display: flex; flex-direction: column; gap: 5px; strong { font-size: 22px; } small { opacity: .7; }`;
const Filters = styled.div`display: grid; grid-template-columns: 2fr repeat(5, minmax(130px, 1fr)); gap: 10px; align-items: end; @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); } .bp4-form-group { margin: 0; }`;
const TableWrap = styled.div`margin-top: 16px; overflow: auto; min-height: 180px;`;
const RowActions = styled.div`display: flex; gap: 5px; flex-wrap: wrap; min-width: 220px;`;
const Pagination = styled.div`display: flex; justify-content: space-between; align-items: center; margin-top: 14px;`;
const DetailGrid = styled.div`display: grid; grid-template-columns: 180px 1fr; gap: 9px 14px; align-items: start;`;
const Code = styled.code`word-break: break-all; font-size: 12px;`;
const Pre = styled.pre`margin: 0; max-height: 280px; overflow: auto; white-space: pre-wrap; word-break: break-word; background: rgba(127,127,127,.09); padding: 10px; border-radius: 4px; font-size: 11px;`;
