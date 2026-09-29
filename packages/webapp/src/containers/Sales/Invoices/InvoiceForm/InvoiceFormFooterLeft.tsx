import { Button, Intent } from '@blueprintjs/core';
import { isEmpty } from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { FFormGroup, FEditableText, Box, Group, Stack } from '@/components';
import { PaymentOptionsButtonPopver } from '@/containers/PaymentMethods/SelectPaymentMethodPopover';
import { MastercardIcon } from '@/icons/Mastercard';
import { VisaIcon } from '@/icons/Visa';

export function InvoiceFormFooterLeft() {
  const { paymentServices } = useInvoiceFormContext();
  const history = useHistory();

  const handleSetupPaymentsClick = () => {
    history.push('/preferences/payment-methods');
  };

  return (
    <Stack spacing={20}>
      {/* --------- Invoice message --------- */}
      <InvoiceMsgFormGroup
        name={'invoiceMessage'}
        label={intl.get('invoice_message')}
      >
        <FEditableText
          name={'invoiceMessage'}
          placeholder={intl.get('invoice_form.invoice_message.placeholder')}
          fastField
          multiline
        />
      </InvoiceMsgFormGroup>

      {/* --------- Terms and conditions --------- */}
      <TermsConditsFormGroup
        label={intl.get('invoice_form.label.terms_conditions')}
        name={'termsConditions'}
      >
        <FEditableText
          name={'termsConditions'}
          placeholder={intl.get(
            'invoice_form.terms_and_conditions.placeholder',
          )}
          multiline
          fastField
        />
      </TermsConditsFormGroup>

      {/* --------- Payment Options --------- */}
      <PaymentOptionsFormGroup
        label={'Opciones de pago'}
        name={'paymentMethodId'}
      >
        <PaymentOptionsText>
          Selecciona una opción de pago en línea para cobrar más rápido{' '}
          <Group spacing={6} style={{ marginLeft: 8 }}>
            <VisaIcon />
            <MastercardIcon />
          </Group>
          {isEmpty(paymentServices) ? (
            <PaymentOptionsButton
              intent={Intent.PRIMARY}
              onClick={handleSetupPaymentsClick}
              small
              minimal
            >
              Configurar pasarelas de pago
            </PaymentOptionsButton>
          ) : (
            <PaymentOptionsButtonPopver paymentMethods={paymentServices ?? []}>
              <PaymentOptionsButton intent={Intent.PRIMARY} small minimal>
                Opciones de pago
              </PaymentOptionsButton>
            </PaymentOptionsButtonPopver>
          )}
        </PaymentOptionsText>
      </PaymentOptionsFormGroup>
    </Stack>
  );
}

const InvoiceMsgFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .bp4-form-content {
      margin-left: 10px;
    }
  }
`;

const TermsConditsFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .bp4-form-content {
      margin-left: 10px;
    }
  }
`;

const PaymentOptionsFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-weight: 500;
      font-size: 12px;
      margin-bottom: 10px;
    }
  }
`;

const PaymentOptionsText = styled(Box)`
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  color: var(--color-muted-text);
`;

const PaymentOptionsButton = styled(Button)`
  font-size: 13px;
  margin-left: 4px;

  &.bp4-minimal.bp4-intent-primary {
    color: #D65F13;
  }
`;
