import { Intent, Alert } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import { withBankingActions } from '../../withBankingActions';
import type { WithBankingActionsProps } from '../../withBankingActions';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import type { WithAlertStoreConnectProps } from '@/containers/Alert/withAlertStoreConnect';
import { AppToaster } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { useUncategorizeTransactionsBulkAction } from '@/hooks/query/banking';
import { compose } from '@/utils';

interface UncategorizeBankTransactionsBulkAlertProps
  extends Pick<WithAlertActionsProps, 'closeAlert'>,
    Pick<WithBankingActionsProps, 'resetCategorizedTransactionsSelected'>,
    WithAlertStoreConnectProps {
  name: string;
}

/**
 * Uncategorize bank account transactions in build alert.
 */
function UncategorizeBankTransactionsBulkAlertInner({
  name,

  // #withAlertStoreConnect
  isOpen,
  payload,

  // #withAlertActions
  closeAlert,

  // #withBankingActions
  resetCategorizedTransactionsSelected,
}: UncategorizeBankTransactionsBulkAlertProps) {
  const { mutateAsync: uncategorizeTransactions, isPending: isLoading } =
    useUncategorizeTransactionsBulkAction();

  const uncategorizeTransactionsIds = (payload?.uncategorizeTransactionsIds ??
    []) as number[];

  // Handle activate item alert cancel.
  const handleCancelActivateItem = () => {
    closeAlert(name);
  };

  // Handle confirm item activated.
  const handleConfirmItemActivate = () => {
    uncategorizeTransactions({ ids: uncategorizeTransactionsIds })
      .then(() => {
        AppToaster.show({
          message: 'Se ha quitado la categoría de las transacciones seleccionadas.',
          intent: Intent.SUCCESS,
        });
        resetCategorizedTransactionsSelected();
      })
      .catch(() => {
        AppToaster.show({
          message: 'Se ha producido un error al quitar la categoría de las transacciones.',
          intent: Intent.DANGER,
        });
      })
      .finally(() => {
        closeAlert(name);
      });
  };

  return (
    <Alert
      cancelButtonText={intl.get('cancel')}
      confirmButtonText={'Quitar categoría de las transacciones'}
      intent={Intent.DANGER}
      isOpen={isOpen}
      onCancel={handleCancelActivateItem}
      loading={isLoading}
      onConfirm={handleConfirmItemActivate}
    >
      <p>
        ¿Seguro que quieres quitar la categoría de las transacciones bancarias seleccionadas? Esta acción no se puede deshacer, aunque podrás volver a categorizarlas.
      </p>
    </Alert>
  );
}

export const UncategorizeBankTransactionsBulkAlert = compose(
  withAlertStoreConnect(),
  withAlertActions,
  withBankingActions,
)(UncategorizeBankTransactionsBulkAlertInner);
