import { Button, Classes, Intent } from '@blueprintjs/core';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import * as R from 'ramda';
import * as Yup from 'yup';
import { usePaymentReceiveFormContext } from '../../PaymentReceiveFormProvider';
import { usePaymentReceivedTotalExceededAmount } from '../../utils';
import { FormatNumber } from '@/components';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';

type ExcessPaymentValues = Record<string, never>;

type WithDialogActionsProps = {
  closeDialog: (name: string) => void;
};

type ExcessPaymentDialogContentRootProps = WithDialogActionsProps & {
  dialogName: string;
};

export function ExcessPaymentDialogContentRoot({
  dialogName,
  closeDialog,
}: ExcessPaymentDialogContentRootProps) {
  const { submitForm, values } = useFormikContext<{ currencyCode?: string }>();
  const { setIsExcessConfirmed } = usePaymentReceiveFormContext();
  const exceededAmount = usePaymentReceivedTotalExceededAmount();

  const handleSubmit = (
    _values: ExcessPaymentValues,
    { setSubmitting }: FormikHelpers<ExcessPaymentValues>,
  ) => {
    setSubmitting(true);
    setIsExcessConfirmed(true);

    submitForm().then(() => {
      closeDialog(dialogName);
      setSubmitting(false);
    });
  };
  const handleClose = () => {
    closeDialog(dialogName);
  };

  return (
    <Formik
      initialValues={{} as ExcessPaymentValues}
      validationSchema={Yup.object().shape({})}
      onSubmit={handleSubmit}
    >
      <Form>
        <ExcessPaymentDialogContentForm
          exceededAmount={
            <FormatNumber
              value={exceededAmount}
              currency={values.currencyCode}
              noZero={false}
            />
          }
          onClose={handleClose}
        />
      </Form>
    </Formik>
  );
}

export const ExcessPaymentDialogContent = R.compose(withDialogActions)(
  ExcessPaymentDialogContentRoot,
);

type ExcessPaymentDialogContentFormProps = {
  onClose?: () => void;
  exceededAmount: React.ReactNode;
};

function ExcessPaymentDialogContentForm({
  onClose,
  exceededAmount,
}: ExcessPaymentDialogContentFormProps) {
  const { submitForm, isSubmitting } = useFormikContext();

  const handleCloseBtn = () => {
    onClose && onClose();
  };

  return (
    <>
      <div className={Classes.DIALOG_BODY}>
        <p style={{ marginBottom: 20 }}>
          ¿Quieres registrar el importe excedente de{' '}
          <strong>{exceededAmount}</strong> como crédito del cliente.
        </p>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            intent={Intent.PRIMARY}
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => submitForm()}
          >
            Guardar el pago como crédito
          </Button>
          <Button onClick={handleCloseBtn}>Cancelar</Button>
        </div>
      </div>
    </>
  );
}
