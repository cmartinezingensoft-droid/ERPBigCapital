import { Alert, Intent } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { compose, saveInvoke } from '@/utils';

interface ChangingFullAmountAlertPayload {
  // Empty payload — alert reads no payload field.
  [key: string]: unknown;
}

interface ChangingFullAmountAlertProps extends WithAlertActionsProps {
  name: string;
  isOpen: boolean;
  payload: ChangingFullAmountAlertPayload;
  onConfirm?: (event: React.SyntheticEvent<HTMLElement>) => void;
}

/**
 * Changing full-amount alert in payment made form.
 */
function ChangingFullAmountAlertInner({
  name,
  onConfirm,
  isOpen,
  payload,
  closeAlert,
}: ChangingFullAmountAlertProps): React.ReactElement {
  const handleCancel = () => {
    closeAlert(name);
  };

  const handleConfirm = (event: React.SyntheticEvent<HTMLElement>) => {
    closeAlert(name);
    saveInvoke(onConfirm, event);
  };

  return (
    <Alert
      cancelButtonText={intl.get('cancel')}
      confirmButtonText={intl.get('ok')}
      intent={Intent.DANGER}
      isOpen={isOpen}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      <p>
        Cambiar el importe total modificará todos los créditos y pagos aplicados. ¿Quieres continuar?
      </p>
    </Alert>
  );
}

export const ChangingFullAmountAlert = compose(
  withAlertStoreConnect(),
  withAlertActions,
)(ChangingFullAmountAlertInner);
