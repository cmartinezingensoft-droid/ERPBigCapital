import intl from 'react-intl-universal';
import * as Yup from 'yup';

const Schema = Yup.object().shape({
  customerType: Yup.string()
    .required()
    .trim()
    .label(intl.get('customer_type_')),
  salutation: Yup.string().trim(),
  firstName: Yup.string().trim(),
  lastName: Yup.string().trim(),
  companyName: Yup.string().trim(),
  displayName: Yup.string().trim().required().label(intl.get('display_name_')),
  code: Yup.string().trim(),

  email: Yup.string().email().nullable(),
  workPhone: Yup.string().nullable(),
  personalPhone: Yup.string().nullable(),
  website: Yup.string().url().nullable(),

  active: Yup.boolean(),
  note: Yup.string().trim(),

  fiscalNumber: Yup.string().trim().max(20),
  fiscalTerritory: Yup.string().oneOf(['common','canary','ceuta','melilla']).optional(),
  sepaIban: Yup.string().trim().max(34),
  sepaBic: Yup.string().trim().max(11),
  sepaAccountHolder: Yup.string().trim().max(255),
  paymentMethod: Yup.string().oneOf(['receipt', 'transfer', 'direct-debit', 'negotiable-draft', 'promissory-note', 'cash', 'card', 'other']),
  paymentTermsDays: Yup.string()
    .trim()
    .max(255)
    .matches(/^(\d+\s*,\s*)*\d*$/, 'Use días separados por coma. Ej: 30,60,90'),
  fiscalCountry: Yup.string().trim().uppercase().length(2),
  taxRegime: Yup.string().trim().oneOf(['standard', 'exempt', 'not_subject', 'reverse_charge']),
  electronicInvoiceChannel: Yup.string().oneOf(['none', 'face', 'b2b-public', 'b2b-private', 'auto']),
  electronicInvoiceEndpoint: Yup.string().max(255),
  peppolEndpointId: Yup.string().max(128),
  dir3AccountingOffice: Yup.string().max(20),
  dir3ManagementBody: Yup.string().max(20),
  dir3ProcessingUnit: Yup.string().max(20),
  dir3ProposingBody: Yup.string().max(20),
  aeatIdType: Yup.string().trim().oneOf(['', '02', '03', '04', '05', '06', '07']).max(2),

  billingAddressCountry: Yup.string().trim(),
  billingAddress1: Yup.string().trim(),
  billingAddress2: Yup.string().trim(),
  billingAddressCity: Yup.string().trim(),
  billingAddressState: Yup.string().trim(),
  billingAddressPostcode: Yup.string().nullable(),
  billingAddressPhone: Yup.string().nullable(),

  shippingAddressCountry: Yup.string().trim(),
  shippingAddress1: Yup.string().trim(),
  shippingAddress2: Yup.string().trim(),
  shippingAddressCity: Yup.string().trim(),
  shippingAddressState: Yup.string().trim(),
  shippingAddressPostcode: Yup.string().nullable(),
  shippingAddressPhone: Yup.string().nullable(),

  openingBalance: Yup.number().nullable(),
  currencyCode: Yup.string(),
  openingBalanceAt: Yup.date(),
  openingBalanceBranchId: Yup.mixed(),
  openingBalanceExchangeRate: Yup.number().nullable(),
});

export const CreateCustomerForm = Schema;
export const EditCustomerForm = Schema;
