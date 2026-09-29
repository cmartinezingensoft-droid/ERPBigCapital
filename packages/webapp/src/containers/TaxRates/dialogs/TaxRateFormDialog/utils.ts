import { useFormikContext } from 'formik';
import type { TaxRate } from '@farocapital/sdk-ts';
import { transformToForm } from '@/utils';

export interface TaxRateFormValues {
  name: string;
  code: string;
  rate: string;
  description: string;
  isCompound: boolean;
  isNonRecoverable: boolean;
  taxTerritory: string;
  fiscalRegime: string;
  equivalenceSurchargeRate: string;
  retentionRate: string;
  aeatTaxCode: string;
  aeatRegimeKey: string;
  aeatOperationQualification: string;
  aeatExemptionCause: string;
  spanishOperationType: string;
  ossScheme: string;
  confirmEdit: boolean;
}

export interface TaxRateFormRequestBody {
  name: string;
  code: string;
  rate: number;
  description: string;
  isCompound: boolean;
  isNonRecoverable: boolean;
  taxTerritory?: string;
  fiscalRegime?: string;
  equivalenceSurchargeRate?: number;
  retentionRate?: number;
  aeatTaxCode?: string;
  aeatRegimeKey?: string;
  aeatOperationQualification?: string;
  aeatExemptionCause?: string;
  spanishOperationType?: string;
  ossScheme?: string;
  active: boolean;
}

// Default initial form values.
export const defaultInitialValues: TaxRateFormValues = {
  name: '',
  code: '',
  rate: '',
  description: '',
  isCompound: false,
  isNonRecoverable: false,
  taxTerritory: 'iva',
  fiscalRegime: 'standard',
  equivalenceSurchargeRate: '0',
  retentionRate: '0',
  aeatTaxCode: '01',
  aeatRegimeKey: '01',
  aeatOperationQualification: 'S1',
  aeatExemptionCause: '',
  spanishOperationType: 'domestic',
  ossScheme: '',
  confirmEdit: false,
};

/**
 * Transformers response errors to form errors.
 * @returns {Record<string, string>}
 */
export const transformApiErrors = (
  errors: Array<{ type?: string }>,
): Record<string, string> => {
  const fields: Record<string, string> = {};

  if (errors.find((e) => e.type === 'TAX_CODE_NOT_UNIQUE')) {
    fields.code = 'El código del tipo impositivo ya existe.';
  }
  return fields;
};

/**
 * Tranformes form values to request values.
 */
export const transformFormToReq = (
  form: TaxRateFormValues,
): TaxRateFormRequestBody => {
  return {
    name: form.name,
    code: form.code,
    rate: Number(form.rate),
    description: form.description,
    isCompound: form.isCompound,
    isNonRecoverable: form.isNonRecoverable,
    taxTerritory: form.taxTerritory || 'iva',
    fiscalRegime: form.fiscalRegime,
    equivalenceSurchargeRate: Number(form.equivalenceSurchargeRate || 0),
    retentionRate: Number(form.retentionRate || 0),
    aeatTaxCode: form.aeatTaxCode || '01',
    aeatRegimeKey: form.aeatRegimeKey || '01',
    aeatOperationQualification: form.aeatOperationQualification || undefined,
    aeatExemptionCause: form.aeatExemptionCause || undefined,
    spanishOperationType: form.spanishOperationType || 'domestic',
    ossScheme: form.ossScheme || undefined,
    active: true,
  };
};

/**
 * Detarmines whether the tax rate changed.
 * @param initialValues
 * @param formValues
 * @returns {boolean}
 */
export const isTaxRateChange = (
  initialValues: TaxRateFormValues,
  formValues: TaxRateFormValues,
): boolean => {
  return (
    initialValues.rate !== formValues.rate ||
    initialValues.taxTerritory !== formValues.taxTerritory ||
    initialValues.fiscalRegime !== formValues.fiscalRegime ||
    initialValues.equivalenceSurchargeRate !== formValues.equivalenceSurchargeRate ||
    initialValues.retentionRate !== formValues.retentionRate ||
    initialValues.aeatTaxCode !== formValues.aeatTaxCode ||
    initialValues.aeatRegimeKey !== formValues.aeatRegimeKey ||
    initialValues.aeatOperationQualification !== formValues.aeatOperationQualification ||
    initialValues.aeatExemptionCause !== formValues.aeatExemptionCause ||
    initialValues.spanishOperationType !== formValues.spanishOperationType ||
    initialValues.ossScheme !== formValues.ossScheme
  );
};

/**
 * Detarmines whether the tax rate changed.
 * @returns {boolean}
 */
export const useIsTaxRateChanged = (): boolean => {
  const { initialValues, values } = useFormikContext<TaxRateFormValues>();

  return isTaxRateChange(initialValues, values);
};

const convertFormAttrsToBoolean = (
  form: TaxRateFormValues,
): TaxRateFormValues => {
  return {
    ...form,
    isCompound: !!form.isCompound,
    isNonRecoverable: !!form.isNonRecoverable,
  };
};

export const transformTaxRateToForm = (
  taxRate?: TaxRate,
): TaxRateFormValues => {
  return convertFormAttrsToBoolean({
    ...defaultInitialValues,
    ...transformToForm(taxRate, defaultInitialValues),
    rate:
      taxRate?.rate != null ? String(taxRate.rate) : defaultInitialValues.rate,
    equivalenceSurchargeRate:
      taxRate?.equivalenceSurchargeRate != null
        ? String(taxRate.equivalenceSurchargeRate)
        : defaultInitialValues.equivalenceSurchargeRate,
    retentionRate:
      taxRate?.retentionRate != null
        ? String(taxRate.retentionRate)
        : defaultInitialValues.retentionRate,
  });
};

export const transformTaxRateCodeValue = (input: string): string => {
  // Remove non-alphanumeric characters and spaces using a regular expression
  const cleanedString = input.replace(/\s+/g, '');

  // Convert the cleaned string to uppercase
  const uppercasedString = cleanedString.toUpperCase();

  return uppercasedString;
};
