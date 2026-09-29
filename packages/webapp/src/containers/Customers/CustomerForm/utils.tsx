import { useFormikContext } from 'formik';
import { first } from 'lodash';
import moment from 'moment';
import React from 'react';
import type {
  CreateCustomerBody,
  Customer,
  EditCustomerBody,
} from '@farocapital/sdk-ts';
import { useCustomerFormContext } from './CustomerFormProvider';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import {
  defaultFastFieldShouldUpdate,
  parseBoolean,
  transformToForm,
} from '@/utils';

export type CustomerFormValues = {
  customerType: string;
  salutation: string;
  firstName: string;
  lastName: string;
  companyName: string;
  displayName: string;
  displayNameFormat: string;
  code: string;

  email: string;
  workPhone: string;
  personalPhone: string;
  website: string;
  note: string;
  active: boolean | string;

  fiscalNumber: string;
  fiscalCountry: string;
  taxRegime: string;
  aeatIdType: string;
  fiscalTerritory: string;
  sepaIban: string;
  sepaBic: string;
  sepaAccountHolder: string;
  paymentMethod: string;
  paymentTermsDays: string;
  electronicInvoiceChannel: string;
  electronicInvoiceEndpoint: string;
  peppolEndpointId: string;
  dir3AccountingOffice: string;
  dir3ManagementBody: string;
  dir3ProcessingUnit: string;
  dir3ProposingBody: string;

  billingAddressCountry: string;
  billingAddress1: string;
  billingAddress2: string;
  billingAddressCity: string;
  billingAddressState: string;
  billingAddressPostcode: string;
  billingAddressPhone: string;

  shippingAddressCountry: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingAddressCity: string;
  shippingAddressState: string;
  shippingAddressPostcode: string;
  shippingAddressPhone: string;

  currencyCode: string;

  openingBalance: string | number;
  openingBalanceAt: string;
  openingBalanceExchangeRate: string | number;
  openingBalanceBranchId: string | number;
};

export const defaultInitialValues: CustomerFormValues = {
  customerType: 'business',
  salutation: '',
  firstName: '',
  lastName: '',
  companyName: '',
  displayName: '',
  displayNameFormat: '',
  code: '',

  email: '',
  workPhone: '',
  personalPhone: '',
  website: '',
  note: '',
  active: true,

  fiscalNumber: '',
  fiscalCountry: 'ES',
  taxRegime: 'standard',
  aeatIdType: '',
  fiscalTerritory: 'common',
  sepaIban: '',
  sepaBic: '',
  sepaAccountHolder: '',
  paymentMethod: 'receipt',
  paymentTermsDays: '30',
  electronicInvoiceChannel: 'none',
  electronicInvoiceEndpoint: '',
  peppolEndpointId: '',
  dir3AccountingOffice: '',
  dir3ManagementBody: '',
  dir3ProcessingUnit: '',
  dir3ProposingBody: '',

  billingAddressCountry: '',
  billingAddress1: '',
  billingAddress2: '',
  billingAddressCity: '',
  billingAddressState: '',
  billingAddressPostcode: '',
  billingAddressPhone: '',

  shippingAddressCountry: '',
  shippingAddress1: '',
  shippingAddress2: '',
  shippingAddressCity: '',
  shippingAddressState: '',
  shippingAddressPostcode: '',
  shippingAddressPhone: '',

  currencyCode: '',

  openingBalance: '',
  openingBalanceAt: moment(new Date()).format('YYYY-MM-DD'),
  openingBalanceExchangeRate: '',
  openingBalanceBranchId: '',
};

const toNumber = (value: string | number): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Transforms a customer (API response) to form initial values.
 */
export const transformCustomerToForm = (
  customer: Partial<Customer> | null | undefined,
  defaults: CustomerFormValues,
): CustomerFormValues =>
  ({
    ...transformToForm(customer ?? {}, defaults),
    active: customer?.active ?? defaults.active,
  }) as CustomerFormValues;

/**
 * Merges partial form overrides on top of defaults (used for initialValues prop).
 */
export const transformValuesToForm = (
  values: Partial<CustomerFormValues>,
  defaults: CustomerFormValues,
): Partial<CustomerFormValues> => transformToForm(values, defaults);

/**
 * Coerces form values into the create-customer request body.
 */
export const transformFormToCreateRequest = (
  values: CustomerFormValues,
): CreateCustomerBody => ({
  customerType: values.customerType,
  currencyCode: values.currencyCode,
  displayName: values.displayName,
  active: parseBoolean(values.active, true),

  salutation: values.salutation,
  firstName: values.firstName,
  lastName: values.lastName,
  companyName: values.companyName,
  code: values.code,
  website: values.website,
  email: values.email,
  workPhone: values.workPhone,
  personalPhone: values.personalPhone,
  note: values.note,

  fiscalNumber: values.fiscalNumber,
  fiscalCountry: values.fiscalCountry.toUpperCase(),
  taxRegime: values.taxRegime,
  aeatIdType: values.aeatIdType || undefined,
  fiscalTerritory: values.fiscalTerritory || 'common',
  sepaIban: values.sepaIban || undefined,
  sepaBic: values.sepaBic || undefined,
  sepaAccountHolder: values.sepaAccountHolder || undefined,
  paymentMethod: values.paymentMethod || undefined,
  paymentTermsDays: values.paymentTermsDays || undefined,

  electronicInvoiceChannel: values.electronicInvoiceChannel || 'none',
  electronicInvoiceEndpoint: values.electronicInvoiceEndpoint || undefined,
  peppolEndpointId: values.peppolEndpointId || undefined,
  dir3AccountingOffice: values.dir3AccountingOffice || undefined,
  dir3ManagementBody: values.dir3ManagementBody || undefined,
  dir3ProcessingUnit: values.dir3ProcessingUnit || undefined,
  dir3ProposingBody: values.dir3ProposingBody || undefined,

  billingAddress1: values.billingAddress1,
  billingAddress2: values.billingAddress2,
  billingAddressCity: values.billingAddressCity,
  billingAddressCountry: values.billingAddressCountry,
  billingAddressPostcode: values.billingAddressPostcode,
  billingAddressPhone: values.billingAddressPhone,
  billingAddressState: values.billingAddressState,

  shippingAddress1: values.shippingAddress1,
  shippingAddress2: values.shippingAddress2,
  shippingAddressCity: values.shippingAddressCity,
  shippingAddressCountry: values.shippingAddressCountry,
  shippingAddressPostcode: values.shippingAddressPostcode,
  shippingAddressPhone: values.shippingAddressPhone,
  shippingAddressState: values.shippingAddressState,

  openingBalance: toNumber(values.openingBalance),
  openingBalanceAt: values.openingBalanceAt,
  openingBalanceExchangeRate: toNumber(values.openingBalanceExchangeRate),
  openingBalanceBranchId: toNumber(values.openingBalanceBranchId),
} as unknown as CreateCustomerBody);

/**
 * Coerces form values into the edit-customer request body (no currency/opening balance).
 */
export const transformFormToEditRequest = (
  values: CustomerFormValues,
): EditCustomerBody => ({
  customerType: values.customerType,
  displayName: values.displayName,
  active: parseBoolean(values.active, true),

  salutation: values.salutation,
  firstName: values.firstName,
  lastName: values.lastName,
  companyName: values.companyName,
  code: values.code,
  website: values.website,
  email: values.email,
  workPhone: values.workPhone,
  personalPhone: values.personalPhone,
  note: values.note,

  fiscalNumber: values.fiscalNumber,
  fiscalCountry: values.fiscalCountry.toUpperCase(),
  taxRegime: values.taxRegime,
  aeatIdType: values.aeatIdType || undefined,
  fiscalTerritory: values.fiscalTerritory || 'common',
  sepaIban: values.sepaIban || undefined,
  sepaBic: values.sepaBic || undefined,
  sepaAccountHolder: values.sepaAccountHolder || undefined,
  paymentMethod: values.paymentMethod || undefined,
  paymentTermsDays: values.paymentTermsDays || undefined,

  electronicInvoiceChannel: values.electronicInvoiceChannel || 'none',
  electronicInvoiceEndpoint: values.electronicInvoiceEndpoint || undefined,
  peppolEndpointId: values.peppolEndpointId || undefined,
  dir3AccountingOffice: values.dir3AccountingOffice || undefined,
  dir3ManagementBody: values.dir3ManagementBody || undefined,
  dir3ProcessingUnit: values.dir3ProcessingUnit || undefined,
  dir3ProposingBody: values.dir3ProposingBody || undefined,

  billingAddress1: values.billingAddress1,
  billingAddress2: values.billingAddress2,
  billingAddressCity: values.billingAddressCity,
  billingAddressCountry: values.billingAddressCountry,
  billingAddressPostcode: values.billingAddressPostcode,
  billingAddressPhone: values.billingAddressPhone,
  billingAddressState: values.billingAddressState,

  shippingAddress1: values.shippingAddress1,
  shippingAddress2: values.shippingAddress2,
  shippingAddressCity: values.shippingAddressCity,
  shippingAddressCountry: values.shippingAddressCountry,
  shippingAddressPostcode: values.shippingAddressPostcode,
  shippingAddressPhone: values.shippingAddressPhone,
  shippingAddressState: values.shippingAddressState,
} as unknown as EditCustomerBody);

export const useSetPrimaryBranchToForm = () => {
  const { setFieldValue } = useFormikContext<CustomerFormValues>();
  const { branches, isBranchesSuccess } = useCustomerFormContext();

  React.useEffect(() => {
    if (isBranchesSuccess) {
      const primaryBranch = branches.find((b) => b.primary) || first(branches);

      if (primaryBranch) {
        setFieldValue('openingBalanceBranchId', primaryBranch.id);
      }
    }
  }, [isBranchesSuccess, setFieldValue, branches]);
};

/**
 * Determines whether the current customer uses a foreign currency.
 */
export const useIsCustomerForeignCurrency = () => {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext<CustomerFormValues>();

  return Boolean(baseCurrency) && baseCurrency !== values.currencyCode;
};

type OpeningBalanceFieldProps = {
  shouldUpdateDeps?: { currencyCode?: string };
  [key: string]: unknown;
};

/**
 * Determines whether the opening balance fast-field should re-render.
 */
export const openingBalanceFieldShouldUpdate = (
  newProps: OpeningBalanceFieldProps,
  oldProps: OpeningBalanceFieldProps,
): boolean =>
  newProps.shouldUpdateDeps?.currencyCode !==
    oldProps.shouldUpdateDeps?.currencyCode ||
  defaultFastFieldShouldUpdate(newProps, oldProps);
