// @ts-nocheck
import { Intent, Alert } from '@blueprintjs/core';
import * as R from 'ramda';
import React from 'react';
import { AppToaster, FormattedMessage as T } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { useCancelMainSubscription } from '@/hooks/query/subscription';

/**
 * Cancel Unlocking partial transactions alerts.
 */
function CancelMainSubscriptionAlertInner({
  name,

  // #withAlertStoreConnect
  isOpen,
  payload: { module },

  // #withAlertActions
  closeAlert,
}) {
  const { mutateAsync: cancelSubscription, isLoading } =
    useCancelMainSubscription();

  // Handle cancel.
  const handleCancel = () => {
    closeAlert(name);
  };
  // Handle confirm.
  const handleConfirm = () => {
    const values = {
      module: module,
    };
    cancelSubscription()
      .then(() => {
        AppToaster.show({
          message: 'La suscripción se ha cancelado.',
          intent: Intent.SUCCESS,
        });
      })
      .catch(({ data: { errors } }) => {})
      .finally(() => {
        closeAlert(name);
      });
  };

  return (
    <Alert
      cancelButtonText={<T id={'cancel'} />}
      confirmButtonText={'Cancelar suscripción'}
      intent={Intent.DANGER}
      isOpen={isOpen}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      loading={isLoading}
    >
      <p>
        <strong>La suscripción de esta organización finalizará.</strong>
      </p>

      <p>
        Dejará de estar accesible para ti y para el resto de usuarios. Asegúrate de haber exportado previamente los datos necesarios.
      </p>
    </Alert>
  );
}

export const CancelMainSubscriptionAlert = R.compose(
  withAlertStoreConnect(),
  withAlertActions,
)(CancelMainSubscriptionAlertInner);
