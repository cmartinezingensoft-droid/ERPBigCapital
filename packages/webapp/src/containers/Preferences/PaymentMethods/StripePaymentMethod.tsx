import {
  Button,
  Classes,
  Intent,
  Menu,
  MenuItem,
  Popover,
  Tag,
  Text,
  Tooltip,
} from '@blueprintjs/core';
import React from 'react';
import styled from 'styled-components';
import { STRIPE_PRICING_LINK } from './constants';
import { usePaymentMethodsBoot } from './PreferencesPaymentMethodsBoot';
import { Box, Card, Group, Stack } from '@/components';
import { DialogsName } from '@/constants/dialogs';
import { DRAWERS } from '@/constants/drawers';
import {
  useAlertActions,
  useDialogActions,
  useDrawerActions,
} from '@/hooks/state';
import { useIsDarkMode } from '@/hooks/useDarkMode';
import { MoreIcon } from '@/icons/More';
import { StripeLogo } from '@/icons/StripeLogo';

export function StripePaymentMethod() {
  const { openDialog } = useDialogActions();
  const { openDrawer } = useDrawerActions();
  const { openAlert } = useAlertActions();
  const isDarkMode = useIsDarkMode();

  const { paymentMethodsState } = usePaymentMethodsBoot();
  const stripeState = paymentMethodsState?.stripe;

  const isAccountCreated = stripeState?.isStripeAccountCreated;
  const isPaymentEnabled = stripeState?.isStripePaymentEnabled;
  const isPayoutEnabled = stripeState?.isStripePayoutEnabled;
  const isStripeEnabled = stripeState?.isStripeEnabled;
  const stripePaymentMethodId = stripeState?.stripePaymentMethodId;
  const isStripeServerConfigured = stripeState?.isStripeServerConfigured;

  // Handle Stripe setup button click.
  const handleSetUpBtnClick = () => {
    openDialog(DialogsName.StripeSetup);
  };

  // Handle edit button click.
  const handleEditBtnClick = () => {
    openDrawer(DRAWERS.STRIPE_PAYMENT_INTEGRATION_EDIT, {
      stripePaymentMethodId: stripePaymentMethodId,
    });
  };

  // Handle delete connection button click.
  const handleDeleteConnectionClick = () => {
    openAlert('delete-stripe-payment-method', {
      paymentMethodId: stripePaymentMethodId,
    });
  };

  return (
    <Card style={{ margin: 0 }}>
      <Group position="apart">
        <Group>
          <StripeLogo
            color={isDarkMode ? 'rgba(255, 255, 255, 0.85)' : '#0A2540'}
          />
          <Group spacing={10}>
            {isStripeEnabled && (
              <Tag minimal intent={Intent.SUCCESS}>
                Activo
              </Tag>
            )}
            {!isPaymentEnabled && isAccountCreated && (
              <Tooltip content="La cuenta no puede aceptar pagos porque la verificación puede estar incompleta, puede haber restricciones legales o de cumplimiento, o faltar documentos por presentar o verificar.">
                <Tag minimal intent={Intent.DANGER}>
                  Pagos no habilitados
                </Tag>
              </Tooltip>
            )}
            {!isPayoutEnabled && isAccountCreated && (
              <Tooltip content="La cuenta no puede recibir transferencias por datos bancarios incompletos o no válidos, una verificación de identidad pendiente o restricciones de cumplimiento.">
                <Tag minimal intent={Intent.DANGER}>
                  Transferencias no habilitadas
                </Tag>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Group spacing={10}>
          {isAccountCreated && (
            <Button small onClick={handleEditBtnClick}>
              Editar
            </Button>
          )}
          {!isAccountCreated && (
            <Button intent={Intent.PRIMARY} small onClick={handleSetUpBtnClick}>
              Configurar
            </Button>
          )}
          {isAccountCreated && (
            <Popover
              content={
                <Menu>
                  <MenuItem
                    intent={Intent.DANGER}
                    text={'Eliminar conexión'}
                    onClick={handleDeleteConnectionClick}
                  />
                </Menu>
              }
            >
              <Button small icon={<MoreIcon height={10} width={10} />} />
            </Popover>
          )}
        </Group>
      </Group>

      <PaymentDescription
        className={Classes.TEXT_MUTED}
        style={{ fontSize: 13 }}
      >
        Stripe es una plataforma de pagos en línea que permite aceptar pagos únicos y recurrentes. Facilita la gestión de transacciones y la conciliación, y su configuración es rápida.
      </PaymentDescription>

      <PaymentFooter>
        <Stack spacing={10}>
          <Text>
            <a target="_blank" rel="noreferrer" href={STRIPE_PRICING_LINK}>
              Ver las comisiones de Stripe
            </a>
          </Text>

          {!isStripeServerConfigured && (
            <Text style={{ color: '#CD4246' }}>
              El pago con Stripe no está configurado en el servidor.{' '}
            </Text>
          )}
        </Stack>
      </PaymentFooter>
    </Card>
  );
}

const PaymentDescription = styled(Text)`
  font-size: 13px;
  margin-top: 12px;
`;

const PaymentFooter = styled(Box)`
  margin-top: 14px;
  font-size: 12px;
`;
