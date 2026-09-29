// @ts-nocheck
import { Classes, Text } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { MANAGE_LINK_URL } from './constants';
import styles from './InvoiceCustomizeGeneralFields.module.scss';
import { Overlay } from './Overlay';
import {
  FFormGroup,
  FieldRequiredHint,
  FInputGroup,
  FSwitch,
  Group,
  Stack,
} from '@/components';
import { useDrawerContext } from '@/components/Drawer/DrawerProvider';
import { FColorInput } from '@/components/Forms/FColorInput';
import { useIsTemplateNamedFilled } from '@/containers/BrandingTemplates/utils';
import { BrandingCompanyLogoUploadField } from '@/containers/ElementCustomize/components/BrandingCompanyLogoUploadField';
import { useDrawerActions } from '@/hooks/state';
import { CreditCardIcon } from '@/icons/CreditCardIcon';

export function InvoiceCustomizeGeneralField() {
  const isTemplateNameFilled = useIsTemplateNamedFilled();

  return (
    <Stack style={{ padding: 20, flex: '1 1 auto' }}>
      <Stack spacing={0}>
        <h2 style={{ fontSize: 16, marginBottom: 10, fontWeight: 600 }}>
          Diseño general
        </h2>
        <p className={Classes.TEXT_MUTED}>
          Configura el logotipo y los colores corporativos para aplicarlos automáticamente a tus facturas.
        </p>
      </Stack>

      <FFormGroup
        name={'templateName'}
        label={'Nombre de la plantilla'}
        labelInfo={<FieldRequiredHint />}
        fastField
        style={{ marginBottom: 10 }}
      >
        <FInputGroup name={'templateName'} fastField />
      </FFormGroup>

      <Overlay visible={!isTemplateNameFilled}>
        <Stack spacing={0}>
          <FFormGroup
            name={'primaryColor'}
            label={'Color principal'}
            style={{ justifyContent: 'space-between' }}
            inline
            fastField
          >
            <FColorInput
              name={'primaryColor'}
              inputProps={{ style: { maxWidth: 120 } }}
              fastField
            />
          </FFormGroup>

          <FFormGroup
            name={'secondaryColor'}
            label={'Color secundario'}
            style={{ justifyContent: 'space-between' }}
            inline
            fastField
          >
            <FColorInput
              name={'secondaryColor'}
              inputProps={{ style: { maxWidth: 120 } }}
              fastField
            />
          </FFormGroup>

          <Stack spacing={10}>
            <FFormGroup
              name={'showCompanyLogo'}
              label={'Logotipo'}
              fastField
              style={{ marginBottom: 0 }}
            >
              <FSwitch
                name={'showCompanyLogo'}
                label={'Mostrar el logotipo de la empresa en el documento'}
                style={{ fontSize: 14 }}
                fastField
              />
            </FFormGroup>

            <BrandingCompanyLogoUploadField />
          </Stack>
        </Stack>

        <InvoiceCustomizePaymentManage />
      </Overlay>
    </Stack>
  );
}

function InvoiceCustomizePaymentManage() {
  const { name } = useDrawerContext();
  const { closeDrawer } = useDrawerActions();

  const handleLinkClick = () => {
    closeDrawer(name);
  };

  return (
    <Group className={styles.customizePayment} position={'apart'}>
      <Group spacing={10}>
        <CreditCardIcon fill={'#7D8897'} height={16} width={16} />
        <Text>Aceptar métodos de pago</Text>
      </Group>

      <Link
        style={{ fontSize: 13 }}
        to={MANAGE_LINK_URL}
        onClick={handleLinkClick}
      >
        Manage
      </Link>
    </Group>
  );
}
