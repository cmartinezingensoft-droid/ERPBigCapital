import React from 'react';
import { Button, Callout, Card, HTMLTable, Intent, Spinner, Tag } from '@blueprintjs/core';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { AppToaster } from '@/components';
import {
  useElectronicInvoiceDocuments,
  useGenerateElectronicInvoice,
} from '@/hooks/query/electronic-invoices';
import { useInvoiceDetailDrawerContext } from './InvoiceDetailDrawerProvider';

export function InvoiceElectronicInvoicingTab() {
  const history = useHistory();
  const { invoiceId } = useInvoiceDetailDrawerContext();
  const { data, isLoading, refetch } = useElectronicInvoiceDocuments(invoiceId);
  const generate = useGenerateElectronicInvoice();

  const run = async (format: 'facturae-3.2.2' | 'ubl-2.1', profile: 'face' | 'b2b-public' | 'b2b-private') => {
    try {
      await generate.mutateAsync({ invoiceId: invoiceId as number, format, profile });
      AppToaster.show({ intent: Intent.SUCCESS, message: 'Nueva versión de factura electrónica generada.' });
      await refetch();
    } catch (error) {
      AppToaster.show({ intent: Intent.DANGER, message: error instanceof Error ? error.message : 'No se pudo generar la factura electrónica.' });
    }
  };

  if (isLoading) return <Center><Spinner /></Center>;
  return <Root>
    <Callout intent={Intent.PRIMARY} title="Factura electrónica estructurada">
      Cada generación crea una versión inmutable con SHA-256. FACe requiere datos DIR3 del cliente y firma XAdES antes de marcar el documento como enviado.
    </Callout>
    <Actions>
      <Button intent={Intent.PRIMARY} icon="document" loading={generate.isPending} onClick={() => run('facturae-3.2.2', 'face')}>Generar Facturae 3.2.2 · FACe</Button>
      <Button icon="document" loading={generate.isPending} onClick={() => run('ubl-2.1', 'b2b-public')}>Generar UBL · B2B pública</Button>
      <Button icon="document" loading={generate.isPending} onClick={() => run('ubl-2.1', 'b2b-private')}>Generar UBL · B2B privada</Button>
      <Button icon="application" onClick={() => history.push('/electronic-invoicing')}>Abrir consola</Button>
    </Actions>
    <Card><HTMLTable striped style={{ width: '100%' }}><thead><tr><th>#</th><th>Formato</th><th>Perfil</th><th>Versión</th><th>Firma</th><th>Estado</th><th>SHA-256</th></tr></thead><tbody>{(data || []).map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.format}</td><td>{row.profile}</td><td>{row.version}</td><td>{row.signatureStatus}</td><td><Tag>{row.status}</Tag></td><td><Hash>{row.payloadSha256}</Hash></td></tr>)}</tbody></HTMLTable></Card>
  </Root>;
}
const Root = styled.div`padding:18px; display:flex; flex-direction:column; gap:14px;`;
const Center = styled.div`padding:35px; display:flex; justify-content:center;`;
const Actions = styled.div`display:flex; gap:7px; flex-wrap:wrap;`;
const Hash = styled.code`font-size:10px; word-break:break-all;`;
