import { Tag, Text } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { ChangeEvent } from 'react';
import styled from 'styled-components';
import { useTaxRateFormDialogContext } from './TaxRateFormDialogBoot';
import {
  TaxRateFormValues,
  transformTaxRateCodeValue,
  useIsTaxRateChanged,
} from './utils';
import { FCheckbox, FFormGroup, FInputGroup, FSelect, Hint } from '@/components';
import {
  AEAT_EXEMPTION_CAUSE_OPTIONS,
  AEAT_OPERATION_QUALIFICATION_OPTIONS,
  AEAT_REGIME_KEY_OPTIONS,
  AEAT_TAX_CODE_OPTIONS,
  FISCAL_REGIME_OPTIONS,
  OSS_SCHEME_OPTIONS,
  SPANISH_OPERATION_TYPE_OPTIONS,
  TAX_TERRITORY_OPTIONS,
} from '@/constants/spainFiscalOptions';

/**
 * Tax rate form content.
 * @returns {JSX.Element}
 */
export function TaxRateFormDialogContent() {
  return (
    <div>
      <FFormGroup
        name={'name'}
        label={'Nombre'}
        labelInfo={<Tag minimal>Obligatorio</Tag>}
        subLabel={
          'Nombre que aparecerá en las facturas y documentos.'
        }
        fastField={true}
      >
        <FInputGroup name={'name'} fastField={true} />
      </FFormGroup>

      <TaxRateCodeField />
      <FFormGroup
        name={'rate'}
        label={'Tipo (%)'}
        labelInfo={<Tag minimal>Obligatorio</Tag>}
        fastField={true}
      >
        <RateFormGroup
          name={'rate'}
          rightElement={<Tag minimal>%</Tag>}
          fill={false}
          fastField={true}
        />
      </FFormGroup>

      <FFormGroup
        name={'description'}
        label={'Descripción'}
        labelInfo={
          <Hint content="Descripción de uso interno; no se mostrará al cliente." />
        }
        fastField={true}
      >
        <FInputGroup name={'description'} fastField={true} />
      </FFormGroup>

      <CompoundFormGroup name={'isCompound'} fastField={true}>
        <FCheckbox label={'Impuesto compuesto'} name={'isCompound'} fastField={true} />
      </CompoundFormGroup>

      <CompoundFormGroup name={'isNonRecoverable'} fastField={true}>
        <FCheckbox
          label={'No deducible'}
          name={'isNonRecoverable'}
          fastField={true}
        />
      </CompoundFormGroup>

      <FiscalDivider />
      <Text><strong>Fiscalidad España / AEAT</strong></Text>
      <FFormGroup name={'taxTerritory'} label={'Territorio fiscal'} fastField>
        <FSelect name={'taxTerritory'} items={TAX_TERRITORY_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'fiscalRegime'} label={'Régimen fiscal'} fastField>
        <FSelect name={'fiscalRegime'} items={FISCAL_REGIME_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'spanishOperationType'} label={'Tipo de operación España'} fastField>
        <FSelect name={'spanishOperationType'} items={SPANISH_OPERATION_TYPE_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'ossScheme'} label={'Régimen OSS/IOSS'} fastField>
        <FSelect name={'ossScheme'} items={OSS_SCHEME_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'equivalenceSurchargeRate'} label={'Recargo de equivalencia (%)'} fastField>
        <FInputGroup name={'equivalenceSurchargeRate'} placeholder={'0'} fastField />
      </FFormGroup>
      <FFormGroup name={'retentionRate'} label={'Retención / IRPF (%)'} fastField>
        <FInputGroup name={'retentionRate'} placeholder={'0'} fastField />
      </FFormGroup>
      <FFormGroup name={'aeatTaxCode'} label={'Impuesto AEAT'} fastField>
        <FSelect name={'aeatTaxCode'} items={AEAT_TAX_CODE_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'aeatRegimeKey'} label={'Clave de régimen AEAT'} helperText={'La validez final depende del libro y tipo de operación.'} fastField>
        <FSelect name={'aeatRegimeKey'} items={AEAT_REGIME_KEY_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'aeatOperationQualification'} label={'Calificación de la operación'} fastField>
        <FSelect name={'aeatOperationQualification'} items={AEAT_OPERATION_QUALIFICATION_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>
      <FFormGroup name={'aeatExemptionCause'} label={'Causa de exención'} fastField>
        <FSelect name={'aeatExemptionCause'} items={AEAT_EXEMPTION_CAUSE_OPTIONS} valueAccessor={'key'} textAccessor={'label'} filterable={false} popoverProps={{ minimal: true }} fastField />
      </FFormGroup>

      <ConfirmEditingTaxRate />
    </div>
  );
}

/**
 * Tax rate code input group
 * @returns {JSX.Element}
 */
function TaxRateCodeField() {
  const { setFieldValue } = useFormikContext<TaxRateFormValues>();

  // Handle the field change.
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const transformedValue = transformTaxRateCodeValue(event.target.value);
    setFieldValue('code', transformedValue);
  };

  return (
    <FFormGroup
      name={'code'}
      label={'Código'}
      labelInfo={<Tag minimal>Obligatorio</Tag>}
      fastField={true}
    >
      <FInputGroup name={'code'} fastField={true} onChange={handleChange} />
    </FFormGroup>
  );
}

function ConfirmEditingTaxRate() {
  const isTaxRateChanged = useIsTaxRateChanged();
  const { isNewMode } = useTaxRateFormDialogContext();

  // Can't continue if it is new mode or tax rate not changed.
  if (!isTaxRateChanged || isNewMode) return null;

  return (
    <EditWarningWrap>
      <Text color={'#766f58'}>Importante:</Text>
      <ConfirmEditFormGroup name={'confirmEdit'} helperText={''}>
        <FCheckbox
          name={'confirmEdit'}
          label={`Entiendo que al modificar el impuesto se desactivará el tipo existente, se creará uno nuevo y se actualizará en las operaciones seleccionadas.`}
        />
      </ConfirmEditFormGroup>
    </EditWarningWrap>
  );
}

const RateFormGroup = styled(FInputGroup)`
  max-width: 100px;
`;

const CompoundFormGroup = styled(FFormGroup)`
  margin-bottom: 0;
`;

const EditWarningWrap = styled(`div`)`
  background: #fcf8ec;
  margin-left: -20px;
  margin-right: -20px;
  padding: 14px 20px;
  font-size: 13px;
  margin-top: 8px;
  border-top: 1px solid #f2eddf;
  border-bottom: 1px solid #f2eddf;
`;

const ConfirmEditFormGroup = styled(FFormGroup)`
  margin-bottom: 0;
`;

const FiscalDivider = styled.div`
  border-top: 1px solid #e1e8ed;
  margin: 16px 0;
`;
