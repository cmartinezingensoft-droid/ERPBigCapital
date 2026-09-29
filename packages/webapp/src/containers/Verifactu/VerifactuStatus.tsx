import React from 'react';
import { Tag } from '@blueprintjs/core';

const intentForStatus = (status?: string | null) => {
  if (!status) return 'none' as const;
  if (status === 'Correcto') return 'success' as const;
  if (status === 'AceptadoConErrores') return 'warning' as const;
  if (status === 'Incorrecto' || status === 'transport_failed') return 'danger' as const;
  if (status === 'pending') return 'primary' as const;
  return 'none' as const;
};

export function VerifactuStatus({ status }: { status?: string | null }) {
  return <Tag intent={intentForStatus(status)} minimal>{status || 'Sin estado'}</Tag>;
}

export function VerifactuDispatchStatus({ state }: { state?: string | null }) {
  const intent = state === 'completed' ? 'success' : state === 'failed' ? 'danger' : state === 'processing' ? 'primary' : state === 'retry' ? 'warning' : 'none';
  return <Tag intent={intent as any} minimal>{state || '—'}</Tag>;
}
