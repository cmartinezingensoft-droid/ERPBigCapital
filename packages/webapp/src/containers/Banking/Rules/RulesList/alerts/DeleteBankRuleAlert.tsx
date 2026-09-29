// @ts-nocheck
import { Intent, Alert } from '@blueprintjs/core';
import React from 'react';
import { FormattedMessage as T } from '@/components';
import { AppToaster } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { useDeleteBankRule } from '@/hooks/query/banking';
import { compose } from '@/utils';

/**
 * Project delete alert.
 */
function BankRuleDeleteAlert({
  name,

  // #withAlertStoreConnect
  isOpen,
  payload: { id },

  // #withAlertActions
  closeAlert,

  // #withDrawerActions
  closeDrawer,
}) {
  const { mutateAsync: deleteBankRule, isLoading } = useDeleteBankRule();

  // handle cancel delete project alert.
  const handleCancelDeleteAlert = () => {
    closeAlert(name);
  };

  // handleConfirm delete project
  const handleConfirmBtnClick = () => {
    deleteBankRule(id)
      .then(() => {
        AppToaster.show({
          message: 'La regla bancaria se ha eliminado correctamente.',
          intent: Intent.SUCCESS,
        });
        closeAlert(name);
      })
      .catch(({ data: { errors } }) => {
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.DANGER,
        });
      });
  };

  return (
    <Alert
      cancelButtonText={<T id={'cancel'} />}
      confirmButtonText={'Eliminar'}
      intent={Intent.DANGER}
      isOpen={isOpen}
      onCancel={handleCancelDeleteAlert}
      onConfirm={handleConfirmBtnClick}
      loading={isLoading}
    >
      <p data-testId={'bank-rule-delete-alert'}>
        ¿Seguro que quieres eliminar la regla bancaria?
      </p>
    </Alert>
  );
}

export const DeleteBankRuleAlert = compose(
  withAlertStoreConnect(),
  withAlertActions,
  withDrawerActions,
)(BankRuleDeleteAlert);
