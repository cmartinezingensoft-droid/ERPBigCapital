import { camelCase, get, upperFirst } from 'lodash';
import { MoneyCategoryPerCreditAccountRootType } from '@/constants/cashflowOptions';

export const initialValues = {
  name: '',
  order: 0,
  applyIfAccountId: '',
  applyIfTransactionType: 'deposit',
  conditionsType: 'and',
  conditions: [
    {
      field: 'description',
      comparator: 'contains',
      value: '',
    },
  ],
  assignCategory: '',
  assignAccountId: '',
};

export interface RuleFormValues {
  name: string;
  order: number;
  applyIfAccountId: string;
  applyIfTransactionType: string;
  conditionsType: string;
  conditions: Array<{
    field: string;
    comparator: string;
    value: string;
  }>;
  assignCategory: string;
  assignAccountId: string;
}

export const TransactionTypeOptions = [
  { value: 'deposit', text: 'Ingreso' },
  { value: 'withdrawal', text: 'Retiro' },
];
export const Fields = [
  { value: 'description', text: 'Description' },
  { value: 'amount', text: 'Importe' },
  { value: 'payee', text: 'Payee' },
];

export const TextFieldConditions = [
  { value: 'contains', text: 'Contains' },
  { value: 'equals', text: 'Equals' },
  { value: 'not_contains', text: 'No contiene' },
];
export const NumberFieldConditions = [
  { value: 'equal', text: 'Equal' },
  { value: 'bigger', text: 'Bigger' },
  { value: 'bigger_or_equal', text: 'Mayor o igual' },
  { value: 'smaller', text: 'Smaller' },
  { value: 'smaller_or_equal', text: 'Menor o igual' },
];

export const FieldCondition = [
  ...TextFieldConditions,
  ...NumberFieldConditions,
];

export const AssignTransactionTypeOptions = [
  { value: 'expense', text: 'Gasto' },
];

export const getAccountRootFromMoneyCategory = (category: string): string[] => {
  const _category = upperFirst(camelCase(category));

  return get(MoneyCategoryPerCreditAccountRootType, _category) || [];
};

export const getFieldConditionsByFieldKey = (fieldKey?: string) => {
  switch (fieldKey) {
    case 'amount':
      return NumberFieldConditions;
    default:
      return TextFieldConditions;
  }
};

export const getDefaultFieldConditionByFieldKey = (fieldKey?: string) => {
  switch (fieldKey) {
    case 'amount':
      return 'bigger_or_equal';
    default:
      return 'contains';
  }
};
