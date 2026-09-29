// @ts-nocheck
import { Button, Intent } from '@blueprintjs/core';
import * as R from 'ramda';
import styles from './BankRulesLandingEmptyState.module.scss';
import { EmptyStatus, Can, FormattedMessage as T } from '@/components';
import { AbilitySubject, BankRuleAction } from '@/constants/abilityOption';
import { DialogsName } from '@/constants/dialogs';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';

function BankRulesLandingEmptyStateRoot({
  // #withDialogAction
  openDialog,
}) {
  const handleNewBtnClick = () => {
    openDialog(DialogsName.BankRuleForm);
  };

  return (
    <EmptyStatus
      title={'Crea reglas para categorizar automáticamente las transacciones bancarias'}
      description={
        <p>
          Las reglas bancarias se ejecutarán automáticamente para categorizar las transacciones entrantes según las condiciones configuradas.
        </p>
      }
      action={
        <>
          <Can I={BankRuleAction.Create} a={AbilitySubject.BankRule}>
            <Button
              intent={Intent.PRIMARY}
              large={true}
              onClick={handleNewBtnClick}
            >
              Nueva regla bancaria
            </Button>

            <Button intent={Intent.NONE} large={true}>
              <T id={'learn_more'} />
            </Button>
          </Can>
        </>
      }
      classNames={{ root: styles.root }}
    />
  );
}

export const BankRulesLandingEmptyState = R.compose(withDialogActions)(
  BankRulesLandingEmptyStateRoot,
);
