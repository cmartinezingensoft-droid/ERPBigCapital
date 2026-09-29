import { Button, DialogBody, DialogFooter, Intent } from '@blueprintjs/core';
import { useState } from 'react';
import styled from 'styled-components';
import { usePaymentMethodsBoot } from '../../PreferencesPaymentMethodsBoot';
import { Stack } from '@/components';
import { useDialogContext } from '@/components/Dialog/DialogProvider';
import { useDialogActions } from '@/hooks/state';
import { CreditCard2Icon } from '@/icons/CreditCard2';
import { DollarIcon } from '@/icons/Dollar';
import { LayoutAutoIcon } from '@/icons/LayoutAuto';
import { SwitchIcon } from '@/icons/SwitchIcon';

export function StripePreSetupDialogContent() {
  const { name } = useDialogContext();
  const { closeDialog } = useDialogActions();
  const { paymentMethodsState } = usePaymentMethodsBoot();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const handleSetUpBtnClick = () => {
    if (paymentMethodsState?.stripe.stripeAuthLink) {
      setIsRedirecting(true);
      window.location.href = paymentMethodsState?.stripe.stripeAuthLink;
    }
  };
  // Handle cancel button click.
  const handleCancelBtnClick = () => {
    closeDialog(name);
  };

  return (
    <>
      <DialogBody>
        <Stack style={{ paddingTop: 10, paddingBottom: 20 }}>
          <PaymentFeatureItem>
            <PaymentFeatureIcon>
              <LayoutAutoIcon size={16} />
            </PaymentFeatureIcon>{' '}
            Si ya utilizas Stripe, puedes conectar tu cuenta de Stripe con FaroCapital.
          </PaymentFeatureItem>

          <PaymentFeatureItem>
            <PaymentFeatureIcon>
              <DollarIcon size={16} />
            </PaymentFeatureIcon>{' '}
            Stripe aplica una comisión de procesamiento por cada pago con tarjeta; FaroCapital solo gestiona la suscripción de la aplicación.
          </PaymentFeatureItem>

          <PaymentFeatureItem>
            <PaymentFeatureIcon>
              <CreditCard2Icon size={16} />
            </PaymentFeatureIcon>{' '}
            Los clientes pueden pagar facturas con tarjeta de crédito, débito o monederos digitales como Apple Pay o Google Pay.
          </PaymentFeatureItem>

          <PaymentFeatureItem>
            <PaymentFeatureIcon>
              <SwitchIcon size={16} />
            </PaymentFeatureIcon>{' '}
            Puedes activar o desactivar los pagos con tarjeta para cada factura
          </PaymentFeatureItem>
        </Stack>
      </DialogBody>

      <DialogFooter
        actions={
          <>
            <Button onClick={handleCancelBtnClick}>Cancelar</Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={handleSetUpBtnClick}
              loading={isRedirecting}
            >
              Configurar Stripe
            </Button>
          </>
        }
      ></DialogFooter>
    </>
  );
}

const PaymentFeatureItem = styled('div')`
  padding-left: 20px;
  position: relative;
  padding-left: 50px;
`;

const PaymentFeatureIcon = styled('span')`
  position: absolute;
  left: 12px;
  top: 2px;
  color: var(--color-primary);
`;
