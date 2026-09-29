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
import styled from 'styled-components';
import type {
  ElectronicInvoiceConsoleQuery,
  ElectronicInvoiceDocument,
  ElectronicInvoiceDeliveryStatus,
} from '@farocapital/sdk-ts';
import { AppToaster, DashboardPageContent } from '@/components';
import {
  useElectronicInvoiceCapabilities,
  useElectronicInvoiceConsole,
  useElectronicInvoiceDocument,
  useCreateElectronicInvoiceStatusEvent,
  useImportSignedElectronicInvoice,
  useUpdateElectronicInvoiceDelivery,
} from '@/hooks/query/electronic-invoices';

const date = (value?: string) => value ? new Date(value).toLocaleString('es-ES') : '—';
const intent = (status?: string): Intent => status === 'accepted' ? Intent.SUCCESS : status === 'rejected' || status === 'failed' ? Intent.DANGER : status === 'submitted' ? Intent.PRIMARY : status === 'ready' ? Intent.SUCCESS : Intent.NONE;

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function DocumentDialog({ id, onClose }: { id?: number; onClose: () => void }) {
  const { data, isLoading, refetch } = useElectronicInvoiceDocument(id);
  const importSigned = useImportSignedElectronicInvoice();
  const delivery = useUpdateElectronicInvoiceDelivery();
  const statusEvent = useCreateElectronicInvoiceStatusEvent();
  const [externalReference, setExternalReference] = React.useState('');

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      AppToaster.show({ intent: Intent.SUCCESS, message });
      await refetch();
    } catch (error) {
      AppToaster.show({ intent: Intent.DANGER, message: error instanceof Error ? error.message : 'Operación no completada.' });
    }
  };

  const onSignedFile = async (file?: File) => {
    if (!file || !id) return;
    const signedPayload = await file.text();
    await run(() => importSigned.mutateAsync({ id, signedPayload }), 'Documento firmado importado; se ha registrado su huella SHA-256.');
  };

  const setDelivery = (status: ElectronicInvoiceDeliveryStatus) => id && run(
    () => delivery.mutateAsync({ id, status, externalReference: externalReference || undefined }),
    `Estado actualizado a ${status}.`,
  );

  const addEvent = (eventType: 'commercial_acceptance' | 'commercial_rejection' | 'full_payment') => id && run(
    () => statusEvent.mutateAsync({ id, eventType }),
    `Evento B2B registrado: ${eventType}.`,
  );

  return (
    <Dialog isOpen={Boolean(id)} onClose={onClose} title={data ? `${data.format} · v${data.version}` : 'Factura electrónica'} style={{ width: 'min(1050px, 95vw)' }}>
      <div className="bp4-dialog-body">
        {isLoading || !data ? <Spinner /> : <Detail>
          <strong>Perfil</strong><span>{data.profile}</span>
          <strong>Estado</strong><span><Tag intent={intent(data.status)}>{data.status}</Tag></span>
          <strong>Firma</strong><span>{data.signatureStatus}</span>
          <strong>SHA-256 original</strong><Code>{data.payloadSha256 || '—'}</Code>
          <strong>SHA-256 firmado</strong><Code>{data.signedPayloadSha256 || '—'}</Code>
          <strong>Referencia externa</strong><span>{data.externalReference || '—'}</span>
          <strong>Generado</strong><span>{date(data.generatedAt)}</span>
          <strong>Error</strong><span>{[data.errorCode, data.errorMessage].filter(Boolean).join(' · ') || '—'}</span>
          <strong>XML</strong><Pre>{data.payload || '—'}</Pre>
          <strong>Respuesta externa</strong><Pre>{data.responsePayload || '—'}</Pre>
        </Detail>}
      </div>
      {data && <div className="bp4-dialog-footer"><Actions>
        <Button icon="download" onClick={() => data.payload && downloadText(`factura-${data.saleInvoiceId}-${data.format}-v${data.version}.xml`, data.payload)}>Descargar XML</Button>
        {data.signedPayload && <Button icon="download" onClick={() => downloadText(`factura-${data.saleInvoiceId}-${data.format}-v${data.version}.xsig`, data.signedPayload || '')}>Descargar firmado</Button>}
        {(data.profile === 'face' || data.profile === 'b2b-private') && data.signatureStatus !== 'signed' && <label className="bp4-button"><input type="file" accept=".xml,.xsig" hidden onChange={(e) => onSignedFile(e.target.files?.[0])} />Importar firma</label>}
        <InputGroup placeholder="CSV / referencia plataforma" value={externalReference} onChange={(e) => setExternalReference(e.target.value)} />
        <Button onClick={() => setDelivery('submitted')}>Marcar enviado</Button>
        <Button intent={Intent.SUCCESS} onClick={() => setDelivery('accepted')}>Aceptado</Button>
        <Button intent={Intent.DANGER} onClick={() => setDelivery('rejected')}>Rechazado</Button>
        {data.profile !== 'face' && <>
          <Button small onClick={() => addEvent('commercial_acceptance')}>Aceptación B2B</Button>
          <Button small onClick={() => addEvent('commercial_rejection')}>Rechazo B2B</Button>
          <Button small onClick={() => addEvent('full_payment')}>Pago completo</Button>
        </>}
        <Button onClick={onClose}>Cerrar</Button>
      </Actions></div>}
    </Dialog>
  );
}

export function ElectronicInvoicingConsole() {
  const [query, setQuery] = React.useState<ElectronicInvoiceConsoleQuery>({ page: 1, pageSize: 25 });
  const [detailId, setDetailId] = React.useState<number>();
  const { data: capabilities } = useElectronicInvoiceCapabilities();
  const { data, isLoading, refetch } = useElectronicInvoiceConsole(query);
  const page = data?.pagination.page || 1;
  const pages = data?.pagination.pages || 1;

  return <>
    <DashboardPageContent><Page>
      <Header><div><h2>Factura electrónica · España</h2><p>Facturae 3.2.2 / FACe y UBL basado en EN16931 para B2B.</p></div><Button icon="refresh" onClick={() => refetch()}>Actualizar</Button></Header>
      <Callout intent={Intent.PRIMARY} title="Fase 7 · arquitectura preparada para la normativa vigente">
        Facturae/FACe está preparado para generación, DIR3 y firma externa XAdES. El perfil técnico definitivo de la solución pública B2B queda versionado como pendiente de la orden ministerial de desarrollo.
      </Callout>
      <Card><Filters>
        <FormGroup label="Buscar"><InputGroup value={query.search || ''} placeholder="Factura, cliente o referencia externa" onChange={(e) => setQuery((q) => ({ ...q, page: 1, search: e.target.value }))} /></FormGroup>
        <FormGroup label="Formato"><HTMLSelect value={query.format || ''} onChange={(e) => setQuery((q) => ({ ...q, page: 1, format: e.target.value as any }))}><option value="">Todos</option><option value="facturae-3.2.2">Facturae 3.2.2</option><option value="ubl-2.1">UBL 2.1</option></HTMLSelect></FormGroup>
        <FormGroup label="Perfil"><HTMLSelect value={query.profile || ''} onChange={(e) => setQuery((q) => ({ ...q, page: 1, profile: e.target.value as any }))}><option value="">Todos</option><option value="face">FACe</option><option value="b2b-public">B2B solución pública</option><option value="b2b-private">B2B plataforma privada</option></HTMLSelect></FormGroup>
        <FormGroup label="Estado"><HTMLSelect value={query.status || ''} onChange={(e) => setQuery((q) => ({ ...q, page: 1, status: e.target.value || undefined }))}><option value="">Todos</option><option value="generated">Generado</option><option value="ready">Preparado</option><option value="submitted">Enviado</option><option value="accepted">Aceptado</option><option value="rejected">Rechazado</option><option value="failed">Fallido</option></HTMLSelect></FormGroup>
      </Filters></Card>
      <Card>{isLoading ? <Spinner /> : <TableWrap><HTMLTable striped interactive style={{ width: '100%' }}><thead><tr><th>Factura</th><th>Cliente</th><th>Formato</th><th>Perfil</th><th>Versión</th><th>Firma</th><th>Estado</th><th>Generado</th></tr></thead><tbody>{(data?.data || []).map((row: ElectronicInvoiceDocument) => <tr key={row.id} onClick={() => setDetailId(row.id)}><td>{row.invoiceNo || `#${row.saleInvoiceId}`}</td><td>{row.customerName || '—'}</td><td>{row.format}</td><td>{row.profile}</td><td>{row.version}</td><td>{row.signatureStatus}</td><td><Tag intent={intent(row.status)}>{row.status}</Tag></td><td>{date(row.generatedAt)}</td></tr>)}</tbody></HTMLTable></TableWrap>}
        <Pager><span>{data?.pagination.total || 0} documentos · página {page}/{pages}</span><div><Button small disabled={page <= 1} onClick={() => setQuery((q) => ({ ...q, page: page - 1 }))}>Anterior</Button><Button small disabled={page >= pages} onClick={() => setQuery((q) => ({ ...q, page: page + 1 }))}>Siguiente</Button></div></Pager>
      </Card>
      {capabilities && <small>Modelo semántico: {capabilities.semanticModel} · generación Facturae/UBL activa.</small>}
    </Page></DashboardPageContent>
    <DocumentDialog id={detailId} onClose={() => setDetailId(undefined)} />
  </>;
}

const Page = styled.div`padding: 22px; display:flex; flex-direction:column; gap:16px;`;
const Header = styled.div`display:flex; justify-content:space-between; gap:12px; align-items:flex-start; h2{margin:0 0 6px;} p{margin:0;}`;
const Filters = styled.div`display:grid; grid-template-columns:2fr repeat(3,1fr); gap:12px;`;
const TableWrap = styled.div`overflow:auto;`;
const Pager = styled.div`display:flex; justify-content:space-between; align-items:center; margin-top:12px; div{display:flex;gap:6px;}`;
const Detail = styled.div`display:grid; grid-template-columns:180px minmax(0,1fr); gap:10px 14px;`;
const Code = styled.code`word-break:break-all; font-size:11px;`;
const Pre = styled.pre`white-space:pre-wrap; word-break:break-word; max-height:280px; overflow:auto; margin:0;`;
const Actions = styled.div`display:flex; flex-wrap:wrap; gap:7px; align-items:center;`;
