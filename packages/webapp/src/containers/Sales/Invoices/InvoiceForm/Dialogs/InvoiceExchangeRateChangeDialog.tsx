import { Button, Classes, Intent } from '@blueprintjs/core';
import { Dialog, DialogSuspense } from '@/components';
import withDialogRedux from '@/components/DialogReduxConnect';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { compose } from '@/utils';

type InvoiceExchangeRateChangeDialogInnerProps = {
  dialogName: string;
  isOpen: boolean;
  closeDialog: (name: string) => void;
};

/**
 * Invoice number dialog.
 */
function InvoiceExchangeRateChangeDialogInner({
  dialogName,
  isOpen,
  // #withDialogActions
  closeDialog,
}: InvoiceExchangeRateChangeDialogInnerProps) {
  const handleConfirm = () => {
    closeDialog(dialogName);
  };

  return (
    <Dialog
      name={dialogName}
      title={'Revisa los nuevos tipos de cambio'}
      autoFocus={true}
      canEscapeKeyClose={true}
      isOpen={isOpen}
      onClose={() => {}}
    >
      <DialogSuspense>
        <div className={Classes.DIALOG_BODY}>
          <p>
            Los precios de los artículos se han <strong>ajustado</strong> a la nueva moneda utilizando el tipo de cambio en tiempo real.
          </p>

          <p style={{ marginBottom: '30px' }}>
            Comprueba que los precios de los artículos coinciden con el tipo de cambio actual de la nueva moneda antes de guardar la transacción.
          </p>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <Button onClick={handleConfirm} intent={Intent.PRIMARY} fill>
            Ok
          </Button>
        </div>
      </DialogSuspense>
    </Dialog>
  );
}

export const InvoiceExchangeRateChangeDialog = compose(
  withDialogRedux(),
  withDialogActions,
)(InvoiceExchangeRateChangeDialogInner);
