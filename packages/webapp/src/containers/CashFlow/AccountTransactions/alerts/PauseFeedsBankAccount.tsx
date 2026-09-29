import { Intent, Alert } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import type { WithAlertStoreConnectProps } from '@/containers/Alert/withAlertStoreConnect';
import { AppToaster } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { usePauseFeedsBankAccount } from '@/hooks/query/banking';
import { compose } from '@/utils';

interface PauseFeedsBankAccountAlertProps
  extends Pick<WithAlertActionsProps, 'closeAlert'>,
    WithAlertStoreConnectProps {
  name: string;
}

/**
 * Pause feeds of the bank account alert.
 */
function PauseFeedsBankAccountAlert({
  name,

  // #withAlertStoreConnect
  isOpen,
  payload,

  // #withAlertActions
  closeAlert,
}: PauseFeedsBankAccountAlertProps) {
  const { mutateAsync: pauseBankAccountFeeds, isPending: isLoading } =
    usePauseFeedsBankAccount();

  const bankAccountId = payload?.bankAccountId as number;

  // Handle activate item alert cancel.
  const handleCancelActivateItem = () => {
    closeAlert(name);
  };
  // Handle confirm item activated.
  const handleConfirmItemActivate = () => {
    pauseBankAccountFeeds({ bankAccountId })
      .then(() => {
        AppToaster.show({
          message: 'La sincronización bancaria de la cuenta se ha pausado.',
          intent: Intent.SUCCESS,
        });
      })
      .catch(() => {})
      .finally(() => {
        closeAlert(name);
      });
  };

  return (
    <Alert
      cancelButtonText={intl.get('cancel')}
      confirmButtonText={'Pausar sincronización bancaria'}
      intent={Intent.WARNING}
      isOpen={isOpen}
      onCancel={handleCancelActivateItem}
      loading={isLoading}
      onConfirm={handleConfirmItemActivate}
    >
      <p>
        ¿Seguro que quieres pausar la sincronización bancaria de esta cuenta? Podrás reanudarla más adelante.
      </p>
    </Alert>
  );
}

export const PauseFeedsBankAccount = compose(
  withAlertStoreConnect(),
  withAlertActions,
)(PauseFeedsBankAccountAlert);
