import { Intent, Alert } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import type { WithAlertStoreConnectProps } from '@/containers/Alert/withAlertStoreConnect';
import type { WithDrawerActionsProps } from '@/containers/Drawer/withDrawerActions';
import { AppToaster } from '@/components';
import { DRAWERS } from '@/constants/drawers';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { useUncategorizeTransaction } from '@/hooks/query';
import { compose } from '@/utils';

interface UncategorizeTransactionAlertProps
  extends Pick<WithAlertActionsProps, 'closeAlert'>,
    Pick<WithDrawerActionsProps, 'closeDrawer'>,
    WithAlertStoreConnectProps {
  name: string;
}

/**
 * Project delete alert.
 */
function UncategorizeTransactionAlertInner({
  name,

  // #withAlertStoreConnect
  isOpen,
  payload,

  // #withAlertActions
  closeAlert,

  // #withDrawerActions
  closeDrawer,
}: UncategorizeTransactionAlertProps) {
  const { mutateAsync: uncategorizeTransaction, isPending: isLoading } =
    useUncategorizeTransaction();

  const uncategorizedTransactionId =
    payload?.uncategorizedTransactionId as number;

  // handle cancel delete project alert.
  const handleCancelDeleteAlert = () => {
    closeAlert(name);
  };

  // handleConfirm delete project
  const handleConfirmBtnClick = () => {
    uncategorizeTransaction(uncategorizedTransactionId)
      .then(() => {
        AppToaster.show({
          message: 'Se ha quitado la categoría de la transacción correctamente.',
          intent: Intent.SUCCESS,
        });
        closeAlert(name);
        closeDrawer(DRAWERS.CASHFLOW_TRNASACTION_DETAILS);
      })
      .catch(() => {
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.DANGER,
        });
      });
  };

  return (
    <Alert
      cancelButtonText={intl.get('cancel')}
      confirmButtonText={'Quitar categoría'}
      intent={Intent.WARNING}
      isOpen={isOpen}
      onCancel={handleCancelDeleteAlert}
      onConfirm={handleConfirmBtnClick}
      loading={isLoading}
    >
      <p>¿Seguro que quieres quitar la categoría de la transacción?</p>
    </Alert>
  );
}

export const UncategorizeTransactionAlert = compose(
  withAlertStoreConnect(),
  withAlertActions,
  withDrawerActions,
)(UncategorizeTransactionAlertInner);
