// @ts-nocheck
import { Intent } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Form, Formik, FormikHelpers } from 'formik';
import { EstimateSendMailFormValues } from './_interfaces';
import { EstimateSendMailSchema } from './EstimateSendMail.schema';
import { useEstimateSendMailBoot } from './EstimateSendMailBoot';
import { AppToaster } from '@/components';
import { useDrawerContext } from '@/components/Drawer/DrawerProvider';
import { useSendSaleEstimateMail } from '@/hooks/query';
import { useDrawerActions } from '@/hooks/state';
import { transformToForm } from '@/utils';

const initialValues: EstimateSendMailFormValues = {
  subject: '',
  message: '',
  to: [],
  cc: [],
  bcc: [],
  attachPdf: true,
};

interface EstimateSendMailFormProps {
  children: React.ReactNode;
}

export function EstimateSendMailForm({ children }: EstimateSendMailFormProps) {
  const { mutateAsync: sendEstimateMail } = useSendSaleEstimateMail();
  const { estimateId, estimateMailState } = useEstimateSendMailBoot();

  const { name } = useDrawerContext();
  const { closeDrawer } = useDrawerActions();

  const _initialValues: EstimateSendMailFormValues = {
    ...initialValues,
    ...transformToForm(estimateMailState, initialValues),
  };
  const handleSubmit = (
    values: EstimateSendMailFormValues,
    { setSubmitting }: FormikHelpers<EstimateSendMailFormValues>,
  ) => {
    setSubmitting(true);
    sendEstimateMail([estimateId, values])
      .then(() => {
        AppToaster.show({
          message: 'El correo de la factura se ha enviado al cliente.',
          intent: Intent.SUCCESS,
        });
        setSubmitting(false);
        closeDrawer(name);
      })
      .catch((error) => {
        setSubmitting(false);
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.SUCCESS,
        });
      });
  };

  return (
    <Formik
      initialValues={_initialValues}
      validationSchema={EstimateSendMailSchema}
      onSubmit={handleSubmit}
    >
      <Form
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        `}
      >
        {children}
      </Form>
    </Formik>
  );
}
