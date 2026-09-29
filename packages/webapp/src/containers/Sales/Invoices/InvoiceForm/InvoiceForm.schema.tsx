import moment from 'moment';
import intl from 'react-intl-universal';
import * as Yup from 'yup';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';
import { TaxType } from '@/interfaces/TaxRates';
import { isBlank } from '@/utils';

const getSchema = () =>
  Yup.object().shape({
    customerId: Yup.string().label(intl.get('customer_name_')).required(),
    invoiceFecha: Yup.date().required().label(intl.get('invoice_date_')),
    dueFecha: Yup.date()
      .min(Yup.ref('invoiceDate'), ({ path, min }) =>
        intl.get('invoice.validation.due_date', {
          path,
          min: moment(min).format('YYYY/MM/DD'),
        }),
      )
      .required()
      .label(intl.get('due_date_')),
    invoiceNo: Yup.string()
      .max(DATATYPES_LENGTH.STRING)
      .label(intl.get('invoice_no_')),
    referenceNo: Yup.string().min(1).max(DATATYPES_LENGTH.STRING),
    operationFecha: Yup.date().transform((value, originalValue) => originalValue === '' ? null : value).nullable(),
    purchaseOrderReference: Yup.string().max(100),
    receiverContractReference: Yup.string().max(100),
    receiverTransactionReference: Yup.string().max(100),
    aeatInvoiceType: Yup.string().oneOf(['F1', 'F2']).required(),
    paymentMethod: Yup.string().oneOf(['receipt', 'transfer', 'direct-debit', 'negotiable-draft', 'promissory-note', 'cash', 'card', 'other']),
    paymentTermsDays: Yup.string()
      .trim()
      .max(255)
      .matches(/^(\d+\s*,\s*)*\d*$/, 'Use días separados por coma. Ej: 30,60,90'),
    delivered: Yup.boolean(),
    fromEstimateId: Yup.string(),
    invoiceMessage: Yup.string()
      .trim()
      .min(1)
      .max(DATATYPES_LENGTH.TEXT)
      .label(intl.get('note')),
    termsConditions: Yup.string()
      .trim()
      .min(1)
      .max(DATATYPES_LENGTH.TEXT)
      .label(intl.get('note')),
    exchangeRate: Yup.number(),
    inclusiveExclusiveTax: Yup.string().oneOf([
      TaxType.Inclusive,
      TaxType.Exclusive,
    ]),
    branchId: Yup.string(),
    warehouseId: Yup.string(),
    projectId: Yup.string(),
    entries: Yup.array().of(
      Yup.object().shape({
        quantity: Yup.number()
          .nullable()
          .max(DATATYPES_LENGTH.INT_10)
          .when(['rate'], {
            is: (rate) => rate,
            then: Yup.number().required(),
          }),
        rate: Yup.number().nullable().max(DATATYPES_LENGTH.INT_10),
        itemId: Yup.number()
          .nullable()
          .when(['quantity', 'rate'], {
            is: (quantity, rate) => !isBlank(quantity) && !isBlank(rate),
            then: Yup.number().required(),
          }),
        discount: Yup.number().nullable().min(0).max(100),
        description: Yup.string().nullable().max(DATATYPES_LENGTH.TEXT),
      }),
    ),
  });

export const getCreateInvoiceFormSchema = getSchema;
export const getEditInvoiceFormSchema = getSchema;
